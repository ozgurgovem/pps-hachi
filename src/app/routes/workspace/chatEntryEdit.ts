import { z, type ZodType } from "zod";
import type { A3EntryRendererMap } from "../../../a3/methodContract";
import type { Entry, ProjectModel } from "../../../domain/model";
import type { ResolvedRedactionPolicy } from "../../../ai/redaction";
import { attemptStructuredProposal, buildProposalPrompt, proposeStructuredEntry } from "./entryProposal";
import { combineTitleAndPayload } from "./entryTranslation";
import { findMissingProtectedTokens } from "./layoutReview";
import { summarizeEntryForAi } from "./entrySummary";

/**
 * D-247 (Barış's own real-use report): the AI support chat used to have only
 * one "accept" action, which wrote the *whole raw chat response* as a new,
 * disconnected `generic-text` entry — even when the AI's own answer was
 * clearly a suggested edit to one of the user's real entries (visible right
 * there in the chat). Barış's own request, matching how he works with
 * Claude itself: the AI should say its suggestion in the chat, ask whether
 * to apply it to the relevant entry, and — on confirmation — actually edit
 * that entry, not invent an unrelated note.
 *
 * Two structured calls, in sequence, both reusing the exact primitives K1/K3
 * already built rather than a new retry/protected-token mechanism (Anayasa
 * Madde 2/G2):
 *
 * 1. `identifySuggestionTargetEntry` — given the suggestion text and a
 *    one-line summary of every entry already in the step, ask the model
 *    which existing entry (if any) the suggestion is about. Schema-only
 *    retry-once (`proposeStructuredEntry`) — there is nothing to protect
 *    here, only an id to pick or `null`. A hallucinated id that doesn't
 *    match any real entry is treated the same as `null` — never trusted
 *    blindly.
 * 2. `proposeEntryEditFromSuggestion` — once a real target entry is known,
 *    ask the model to apply the suggestion to that entry's own current
 *    title+payload, validated against the entry's own real Zod schema (the
 *    caller wraps `plugin.schema`, the same `EntryTranslateField`/K3
 *    pattern) — a mistranslated enum or a dropped required field fails Zod
 *    validation and triggers the retry automatically. Protected-token check
 *    here is deliberately scoped to the SUGGESTION's own text, not the
 *    entry's original content (unlike translation, which must preserve
 *    everything) — applying a suggestion often means *replacing* an old
 *    value with a new one, so protecting the old value would wrongly flag
 *    the very edit the user asked for. What must survive is whatever new
 *    fact the AI's own suggestion introduced — dropping that on apply would
 *    be worse than not applying anything.
 */

const IdentifySuggestionTargetResultSchema = z.object({ targetEntryId: z.string().nullable() });

export interface IdentifySuggestionTargetParams {
  readonly promptBody: string;
  readonly suggestionText: string;
  readonly entries: readonly Entry[];
  readonly project: ProjectModel;
  readonly rendererMap: A3EntryRendererMap;
  readonly modelId: string;
  readonly redaction: ResolvedRedactionPolicy;
  readonly projectId: string;
}

export type IdentifySuggestionTargetOutcome =
  | { readonly outcome: "matched"; readonly targetEntryId: string }
  | { readonly outcome: "noMatch" }
  | { readonly outcome: "failed"; readonly rawText: string };

function formatEntryLine(entry: Entry, project: ProjectModel, rendererMap: A3EntryRendererMap): string {
  const { summary } = summarizeEntryForAi(entry, project.meta.language, rendererMap);
  return `- id="${entry.id}" (method: ${entry.methodId}): ${summary}`;
}

export async function identifySuggestionTargetEntry(
  params: IdentifySuggestionTargetParams,
): Promise<IdentifySuggestionTargetOutcome> {
  if (params.entries.length === 0) {
    return { outcome: "noMatch" };
  }

  const entryLines = params.entries.map((entry) => formatEntryLine(entry, params.project, params.rendererMap)).join("\n");
  const userInput = `Suggestion:\n${params.suggestionText}\n\nExisting entries in this step:\n${entryLines}`;

  const result = await proposeStructuredEntry({
    promptBody: params.promptBody,
    userInput,
    modelId: params.modelId,
    zodSchema: IdentifySuggestionTargetResultSchema,
    redaction: params.redaction,
    projectId: params.projectId,
    promptVersion: "identify-suggestion-target.v1",
  });

  if (result.outcome === "failed") {
    return { outcome: "failed", rawText: result.rawText };
  }

  const value = result.value as z.infer<typeof IdentifySuggestionTargetResultSchema>;
  if (!value.targetEntryId) {
    return { outcome: "noMatch" };
  }
  const targetExists = params.entries.some((entry) => entry.id === value.targetEntryId);
  return targetExists ? { outcome: "matched", targetEntryId: value.targetEntryId } : { outcome: "noMatch" };
}

export interface ProposeEntryEditFromSuggestionParams {
  readonly promptBody: string;
  readonly suggestionText: string;
  readonly title: string;
  readonly payload: unknown;
  readonly modelId: string;
  /** `z.object({ title: z.string(), payload: plugin.schema })`, built by the caller — this file never imports the method registry. */
  readonly zodSchema: ZodType<unknown>;
  readonly redaction: ResolvedRedactionPolicy;
  readonly projectId: string;
  readonly promptVersion: string | null;
}

export type EntryEditFromSuggestionOutcome =
  | { readonly outcome: "success"; readonly title: string; readonly payload: unknown }
  | { readonly outcome: "failed"; readonly rawText: string };

interface EntryEditValue {
  readonly title: string;
  readonly payload: unknown;
}

function buildEntryEditUserInput(suggestionText: string, title: string, payload: unknown): string {
  return [
    `Suggestion to apply:\n${suggestionText}`,
    "",
    `Current title: ${title}`,
    "Current payload (JSON):",
    JSON.stringify(payload, null, 2),
  ].join("\n");
}

export async function proposeEntryEditFromSuggestion(
  params: ProposeEntryEditFromSuggestionParams,
): Promise<EntryEditFromSuggestionOutcome> {
  const jsonSchema = z.toJSONSchema(params.zodSchema, { target: "draft-2020-12" });
  const userInput = buildEntryEditUserInput(params.suggestionText, params.title, params.payload);
  const firstPrompt = buildProposalPrompt(params.promptBody, userInput);

  const first = await attemptStructuredProposal(
    firstPrompt,
    jsonSchema,
    params.modelId,
    params.zodSchema,
    params.redaction,
    params.projectId,
    params.promptVersion,
  );

  if (!first.success) {
    return retryEntryEditFromSuggestion(params, jsonSchema, userInput, first.rawText, first.errorSummary, []);
  }

  const value = first.value as EntryEditValue;
  const missing = findMissingProtectedTokens(params.suggestionText, combineTitleAndPayload(value.title, value.payload));
  if (missing.length === 0) {
    return { outcome: "success", title: value.title, payload: value.payload };
  }

  return retryEntryEditFromSuggestion(
    params,
    jsonSchema,
    userInput,
    JSON.stringify(value, null, 2),
    undefined,
    missing,
  );
}

function buildEntryEditRetryPrompt(
  promptBody: string,
  userInput: string,
  previousRawText: string,
  schemaErrorSummary: string | undefined,
  missingTokens: readonly string[],
): string {
  const parts = [
    buildProposalPrompt(promptBody, userInput),
    `\n\n---\n\n## Your previous attempt was invalid\n\nYour previous response:\n${previousRawText}`,
  ];
  if (schemaErrorSummary) {
    parts.push(`\n\nValidation errors:\n${schemaErrorSummary}`);
  }
  if (missingTokens.length > 0) {
    parts.push(
      `\n\nYour applied edit dropped or altered value(s) your own suggestion introduced: ${missingTokens.map((t) => `"${t}"`).join(", ")}. Include them in the result exactly as you originally proposed.`,
    );
  }
  parts.push(
    "\n\nCorrect these issues and respond again with ONLY valid JSON matching the schema — no prose, no markdown code fences.",
  );
  return parts.join("");
}

async function retryEntryEditFromSuggestion(
  params: ProposeEntryEditFromSuggestionParams,
  jsonSchema: object,
  userInput: string,
  previousRawText: string,
  schemaErrorSummary: string | undefined,
  missingTokens: readonly string[],
): Promise<EntryEditFromSuggestionOutcome> {
  const retryPrompt = buildEntryEditRetryPrompt(
    params.promptBody,
    userInput,
    previousRawText,
    schemaErrorSummary,
    missingTokens,
  );
  const second = await attemptStructuredProposal(
    retryPrompt,
    jsonSchema,
    params.modelId,
    params.zodSchema,
    params.redaction,
    params.projectId,
    params.promptVersion,
  );
  if (!second.success) {
    return { outcome: "failed", rawText: second.rawText };
  }
  const value = second.value as EntryEditValue;
  const stillMissing = findMissingProtectedTokens(params.suggestionText, combineTitleAndPayload(value.title, value.payload));
  if (stillMissing.length > 0) {
    return { outcome: "failed", rawText: JSON.stringify(value, null, 2) };
  }
  return { outcome: "success", title: value.title, payload: value.payload };
}
