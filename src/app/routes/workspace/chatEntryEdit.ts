import { z, type ZodType } from "zod";
import type { A3EntryRendererMap } from "../../../a3/methodContract";
import type { Entry, ProjectModel } from "../../../domain/model";
import type { ResolvedRedactionPolicy } from "../../../ai/redaction";
import { proposeStructuredEntry } from "./entryProposal";
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
 *    pattern) via `proposeStructuredEntry`'s own schema-only retry-once — a
 *    mistranslated enum or a dropped required field fails Zod validation
 *    and triggers the retry automatically.
 *
 *    D-249 (Barış's own real-use report): this originally also ran K1/K3's
 *    combined protected-token check (the suggestion's own new values must
 *    survive into the result) — and it made the feature fail almost every
 *    time. Root-caused by reading the real regex, not guessed: `suggestionText`
 *    here is the AI's own raw chat *response* — full markdown, headers,
 *    alternate phrasings, parenthetical notes — not a clean single fact like
 *    K1's condensation target or K3's translation source. `NAME_PATTERN`
 *    (`layoutReview.ts`'s "two-or-more-capitalized-words" heuristic) matches
 *    a chat response's own section headers just as readily as a real
 *    person's name — a markdown line like "### İyileştirme Önerisi (Nasıl
 *    Olmalı?)" gets "İyileştirme Önerisi" and "Nasıl Olmalı" both flagged as
 *    "protected," and neither will ever legitimately appear inside a
 *    structured entry field, so the check failed on nearly every real
 *    response regardless of whether the actual edit was correct. Removed —
 *    the real safety net for this flow is what it already always was: the
 *    human reviews the proposed title+payload via the target entry's own
 *    labeled `plugin.Editor` (Accept/Edit&Accept/Reject) before anything
 *    ever reaches `ProjectModel` (D-15/D-16), the same review depth K1/K3
 *    give a translated paragraph or a diff line — arguably a *better*-
 *    reviewed surface, since a small labeled form is easier to check at a
 *    glance than a long paragraph.
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
  const userInput = buildEntryEditUserInput(params.suggestionText, params.title, params.payload);

  const result = await proposeStructuredEntry({
    promptBody: params.promptBody,
    userInput,
    modelId: params.modelId,
    zodSchema: params.zodSchema,
    redaction: params.redaction,
    projectId: params.projectId,
    promptVersion: params.promptVersion,
  });

  if (result.outcome === "failed") {
    return { outcome: "failed", rawText: result.rawText };
  }
  const value = result.value as EntryEditValue;
  return { outcome: "success", title: value.title, payload: value.payload };
}
