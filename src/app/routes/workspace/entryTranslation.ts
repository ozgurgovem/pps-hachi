import { z, type ZodType } from "zod";
import { STEP_IDS, type Entry, type ProjectModel, type StepId } from "../../../domain/model";
import type { ResolvedRedactionPolicy } from "../../../ai/redaction";
import { attemptStructuredProposal, buildProposalPrompt } from "./entryProposal";
import {
  collectCondensableFields,
  findMissingProtectedTokens,
  lookupCondensableText,
  type EntryLookupEntry,
} from "./layoutReview";

/**
 * Faz 10/K3: TR↔EN translation, field-level (one entry's title+payload) and
 * whole-report (many entries' translatable fields at once). §1 point 4: the
 * project's language field is binary (`z.enum(["tr", "en"])`, i18next itself
 * only ships tr/en) — there is no language picker anywhere in this file,
 * source is always `project.meta.language` and target is always "the other
 * one."
 */
export type ReportLanguage = ProjectModel["meta"]["language"];

export function otherLanguage(language: ReportLanguage): ReportLanguage {
  return language === "tr" ? "en" : "tr";
}

// ---------------------------------------------------------------------------
// Field-level translation (§2.1/§2.2)
// ---------------------------------------------------------------------------

/** Every string value anywhere inside `value`, walked recursively — payloads nest (row tables, field-form records), so this has to be generic rather than field-aware. */
function collectAllStrings(value: unknown): readonly string[] {
  if (typeof value === "string") {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap(collectAllStrings);
  }
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap(collectAllStrings);
  }
  return [];
}

function combineTitleAndPayload(title: string, payload: unknown): string {
  return [title, ...collectAllStrings(payload)].join("\n");
}

function buildEntryTranslationUserInput(
  title: string,
  payload: unknown,
  sourceLanguage: ReportLanguage,
  targetLanguage: ReportLanguage,
): string {
  return [
    `Source language: ${sourceLanguage}`,
    `Target language: ${targetLanguage}`,
    "",
    `Title: ${title}`,
    "Payload (JSON):",
    JSON.stringify(payload, null, 2),
  ].join("\n");
}

export interface EntryTranslationValue {
  readonly title: string;
  readonly payload: unknown;
}

export type EntryTranslationOutcome =
  | { readonly outcome: "success"; readonly title: string; readonly payload: unknown }
  | { readonly outcome: "failed"; readonly rawText: string };

export interface ProposeEntryTranslationParams {
  readonly promptBody: string;
  readonly title: string;
  readonly payload: unknown;
  readonly sourceLanguage: ReportLanguage;
  readonly targetLanguage: ReportLanguage;
  readonly modelId: string;
  /** `z.object({ title: z.string(), payload: plugin.schema })`, built by the caller — this file never imports the method registry. */
  readonly zodSchema: ZodType<unknown>;
  readonly redaction: ResolvedRedactionPolicy;
}

/**
 * §2.1/§2.3: a single entry's title+payload, translated and schema-validated
 * against the exact same shape as the original (the caller wraps the
 * plugin's own `schema`, so a mistranslated enum field fails Zod validation
 * and triggers the retry below the same as any other schema violation).
 * Protected-token loss is checked the way K1 already checks it
 * (`findMissingProtectedTokens`, exact substring match — Barış's own choice
 * for this dilim over a locale-aware normalized check, since a false flag
 * only ever costs a retry or an unwanted "left in the original language"
 * failure, never a silently wrong write) over a plain newline-joined dump of
 * every string value in title+payload — there is no per-field structure to
 * reason about generically here, unlike the whole-report flow below. A
 * schema failure and a protected-token loss both count as "the attempt
 * failed" and share ONE combined retry, mirroring `layoutReview.ts`'s
 * `proposeLayoutReviewDiff`; unlike that diff (many independent lines), one
 * entry has no smaller unit to partially keep, so a retry that still loses a
 * token fails the whole translation rather than accepting a corrupted draft.
 */
export async function proposeEntryTranslation(
  params: ProposeEntryTranslationParams,
): Promise<EntryTranslationOutcome> {
  const jsonSchema = z.toJSONSchema(params.zodSchema, { target: "draft-2020-12" });
  const userInput = buildEntryTranslationUserInput(
    params.title,
    params.payload,
    params.sourceLanguage,
    params.targetLanguage,
  );
  const originalCombined = combineTitleAndPayload(params.title, params.payload);
  const firstPrompt = buildProposalPrompt(params.promptBody, userInput);

  const first = await attemptStructuredProposal(
    firstPrompt,
    jsonSchema,
    params.modelId,
    params.zodSchema,
    params.redaction,
  );

  if (!first.success) {
    return retryEntryTranslation(params, jsonSchema, userInput, originalCombined, first.rawText, first.errorSummary, []);
  }

  const value = first.value as EntryTranslationValue;
  const missing = findMissingProtectedTokens(originalCombined, combineTitleAndPayload(value.title, value.payload));
  if (missing.length === 0) {
    return { outcome: "success", title: value.title, payload: value.payload };
  }

  return retryEntryTranslation(
    params,
    jsonSchema,
    userInput,
    originalCombined,
    JSON.stringify(value, null, 2),
    undefined,
    missing,
  );
}

function buildEntryTranslationRetryPrompt(
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
      `\n\nYour translation dropped or altered protected value(s): ${missingTokens.map((t) => `"${t}"`).join(", ")}. Restore them exactly as they appear in the original.`,
    );
  }
  parts.push(
    "\n\nCorrect these issues and respond again with ONLY valid JSON matching the schema — no prose, no markdown code fences.",
  );
  return parts.join("");
}

async function retryEntryTranslation(
  params: ProposeEntryTranslationParams,
  jsonSchema: object,
  userInput: string,
  originalCombined: string,
  previousRawText: string,
  schemaErrorSummary: string | undefined,
  missingTokens: readonly string[],
): Promise<EntryTranslationOutcome> {
  const retryPrompt = buildEntryTranslationRetryPrompt(
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
  );
  if (!second.success) {
    return { outcome: "failed", rawText: second.rawText };
  }
  const value = second.value as EntryTranslationValue;
  const stillMissing = findMissingProtectedTokens(originalCombined, combineTitleAndPayload(value.title, value.payload));
  if (stillMissing.length > 0) {
    return { outcome: "failed", rawText: JSON.stringify(value, null, 2) };
  }
  return { outcome: "success", title: value.title, payload: value.payload };
}

// ---------------------------------------------------------------------------
// Whole-report translation (§2.2/§2.4)
// ---------------------------------------------------------------------------

export const TranslationLineSchema = z.object({
  entryId: z.string(),
  field: z.string(),
  translatedText: z.string(),
});
export type TranslationLine = z.infer<typeof TranslationLineSchema>;

export const WholeReportTranslationDiffSchema = z.object({
  lines: z.array(TranslationLineSchema),
});
export type WholeReportTranslationDiff = z.infer<typeof WholeReportTranslationDiffSchema>;

/** Same generous character budget as K1/K2 — not a token count, this environment has no tokenizer on the TS side. */
const MAX_CONTEXT_CHARS = 20000;

export interface WholeReportTranslationContext {
  readonly contextText: string;
  /** §8.14: never silently truncate — empty when nothing needed to shrink. */
  readonly droppedNotes: readonly string[];
}

/**
 * §2.2/§2.6: which fields are "the whole report" reuses K1's own
 * `collectCondensableFields` unchanged rather than a new heuristic — a title
 * is always included, a payload string field only once it clears the same
 * ≥80-character threshold K1 already uses for condensation. This is a
 * deliberate reuse, not laziness: it doubles as a structural guard against
 * ever offering a short enum-coded field (a status value, a select option)
 * to the model as "translatable" — those are always well under the
 * threshold, so they're never sent in the first place, and an accidentally
 * translated enum can't corrupt a schema-validated payload the way it could
 * if this function reinvented its own "what counts as text" rule. The
 * tradeoff — a genuine but short (<80 char) free-text field is not covered
 * by a whole-report pass — is a real, documented gap (see DECISIONS.md),
 * not a silent one.
 */
export function buildWholeReportTranslationContext(
  project: ProjectModel,
  targetLanguage: ReportLanguage,
): WholeReportTranslationContext {
  interface FieldLine {
    readonly stepId: StepId;
    readonly entry: Entry;
    readonly field: string;
    readonly text: string;
  }

  const lines: FieldLine[] = [];
  for (const stepId of STEP_IDS) {
    const step = project.steps[stepId];
    if (!step) {
      continue;
    }
    for (const entry of step.entries) {
      for (const field of collectCondensableFields(entry)) {
        lines.push({ stepId, entry, field: field.field, text: field.text });
      }
    }
  }

  function formatLine(line: FieldLine): string {
    return (
      `Step ${line.stepId} — entryId "${line.entry.id}" (method: ${line.entry.methodId}) ` +
      `field="${line.field}": ${line.text}`
    );
  }

  const header = `Target language: ${targetLanguage}\n\n`;
  const droppedNotes: string[] = [];

  // §8.14: build up to the character budget in one pass rather than
  // truncating after the fact — every kept line is always whole, never cut
  // mid-content.
  let usedChars = header.length;
  const keptLines: FieldLine[] = [];
  for (const line of lines) {
    const formatted = formatLine(line);
    if (usedChars + formatted.length + 1 > MAX_CONTEXT_CHARS) {
      break;
    }
    keptLines.push(line);
    usedChars += formatted.length + 1;
  }

  const contextText = keptLines.length > 0 ? header + keptLines.map(formatLine).join("\n") : `${header}(no translatable content)`;

  if (keptLines.length < lines.length) {
    droppedNotes.push(
      `This project is large enough that ${lines.length - keptLines.length} field(s) were left out of this translation pass to fit the AI's context window — run the translation again after accepting these changes to cover the rest.`,
    );
  }

  return { contextText, droppedNotes };
}

interface ProtectedTokenFailure {
  readonly entryId: string;
  readonly field: string;
  readonly missingTokens: readonly string[];
}

function findWholeReportTokenFailures(
  lines: readonly TranslationLine[],
  lookup: ReadonlyMap<string, EntryLookupEntry>,
): readonly ProtectedTokenFailure[] {
  const failures: ProtectedTokenFailure[] = [];
  for (const line of lines) {
    const original = lookupCondensableText(lookup, line.entryId, line.field);
    if (original === undefined) {
      continue;
    }
    const missing = findMissingProtectedTokens(original, line.translatedText);
    if (missing.length > 0) {
      failures.push({ entryId: line.entryId, field: line.field, missingTokens: missing });
    }
  }
  return failures;
}

function translationLineKey(entryId: string, field: string): string {
  return `${entryId} ${field}`;
}

export type WholeReportTranslationOutcome =
  | { readonly outcome: "success"; readonly diff: WholeReportTranslationDiff; readonly droppedNotes: readonly string[] }
  | { readonly outcome: "failed"; readonly rawText: string };

export interface ProposeWholeReportTranslationParams {
  readonly promptBody: string;
  readonly contextText: string;
  readonly modelId: string;
  readonly redaction: ResolvedRedactionPolicy;
  readonly lookup: ReadonlyMap<string, EntryLookupEntry>;
}

/**
 * §2.2/§2.3: the same combined single-retry discipline as K1's
 * `proposeLayoutReviewDiff` — a schema failure or a lost protected token both
 * count as "the attempt failed," sharing ONE retry; a line that still loses
 * a token on the second attempt is dropped from the diff alone (its text
 * stays untranslated, with a visible note), never the whole diff.
 */
export async function proposeWholeReportTranslation(
  params: ProposeWholeReportTranslationParams,
): Promise<WholeReportTranslationOutcome> {
  const jsonSchema = z.toJSONSchema(WholeReportTranslationDiffSchema, { target: "draft-2020-12" });
  const firstPrompt = buildProposalPrompt(params.promptBody, params.contextText);

  const first = await attemptStructuredProposal(
    firstPrompt,
    jsonSchema,
    params.modelId,
    WholeReportTranslationDiffSchema,
    params.redaction,
  );

  if (!first.success) {
    return retryWholeReportTranslation(params, jsonSchema, first.rawText, first.errorSummary, []);
  }

  const diff = first.value as WholeReportTranslationDiff;
  const failures = findWholeReportTokenFailures(diff.lines, params.lookup);
  if (failures.length === 0) {
    return { outcome: "success", diff, droppedNotes: [] };
  }

  return retryWholeReportTranslation(params, jsonSchema, JSON.stringify(diff, null, 2), undefined, failures);
}

function buildWholeReportTranslationRetryPrompt(
  promptBody: string,
  contextText: string,
  previousRawText: string,
  schemaErrorSummary: string | undefined,
  tokenFailures: readonly ProtectedTokenFailure[],
): string {
  const parts = [
    buildProposalPrompt(promptBody, contextText),
    `\n\n---\n\n## Your previous attempt was invalid\n\nYour previous response:\n${previousRawText}`,
  ];
  if (schemaErrorSummary) {
    parts.push(`\n\nValidation errors:\n${schemaErrorSummary}`);
  }
  if (tokenFailures.length > 0) {
    const lines = tokenFailures.map(
      (f) =>
        `- entryId "${f.entryId}", field "${f.field}": lost protected value(s) ${f.missingTokens.map((t) => `"${t}"`).join(", ")} — restore them in the translated text.`,
    );
    parts.push(`\n\nSome translations dropped protected numbers, dates, part numbers or names:\n${lines.join("\n")}`);
  }
  parts.push(
    "\n\nCorrect these issues and respond again with ONLY valid JSON matching the schema — no prose, no markdown code fences.",
  );
  return parts.join("");
}

async function retryWholeReportTranslation(
  params: ProposeWholeReportTranslationParams,
  jsonSchema: object,
  previousRawText: string,
  schemaErrorSummary: string | undefined,
  tokenFailures: readonly ProtectedTokenFailure[],
): Promise<WholeReportTranslationOutcome> {
  const retryPrompt = buildWholeReportTranslationRetryPrompt(
    params.promptBody,
    params.contextText,
    previousRawText,
    schemaErrorSummary,
    tokenFailures,
  );
  const second = await attemptStructuredProposal(
    retryPrompt,
    jsonSchema,
    params.modelId,
    WholeReportTranslationDiffSchema,
    params.redaction,
  );

  if (!second.success) {
    return { outcome: "failed", rawText: second.rawText };
  }

  const diff = second.value as WholeReportTranslationDiff;
  const stillFailing = findWholeReportTokenFailures(diff.lines, params.lookup);
  if (stillFailing.length === 0) {
    return { outcome: "success", diff, droppedNotes: [] };
  }

  const failingKeys = new Set(stillFailing.map((f) => translationLineKey(f.entryId, f.field)));
  const keptLines = diff.lines.filter((line) => !failingKeys.has(translationLineKey(line.entryId, line.field)));
  const droppedNotes = stillFailing.map(
    (f) =>
      `A translation for entry "${f.entryId}" (field "${f.field}") could not preserve ${f.missingTokens.map((t) => `"${t}"`).join(", ")} — it was left out, the text is unchanged.`,
  );

  return { outcome: "success", diff: { lines: keptLines }, droppedNotes };
}
