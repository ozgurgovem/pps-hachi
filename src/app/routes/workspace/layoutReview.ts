import { z } from "zod";
import type { A3LayoutDescriptor } from "../../../a3/descriptor";
import type { A3EntryRendererMap } from "../../../a3/methodContract";
import {
  A3VisibilitySchema,
  STEP_IDS,
  type Entry,
  type ProjectModel,
  type StepId,
  type StepState,
} from "../../../domain/model";
import type { ResolvedRedactionPolicy } from "../../../ai/redaction";
import { attemptStructuredProposal, buildProposalPrompt } from "./entryProposal";
import { summarizeEntryForAi } from "./entrySummary";

/**
 * Faz 10/K1/§8.10: the A3 placement optimizer's diff shape. Points 1-3 of
 * §8.10 map onto two lists, not three — `chartPreferences` (point 3, "which
 * chart best carries the message") folds into `visibilityChanges` (§2.3's
 * own YAGNI call): making one chart-bearing entry `primary` and its
 * siblings `appendix` *is* a chart preference, expressed with the mechanism
 * that already exists rather than a parallel one that would mean the same
 * thing twice.
 */
export const LayoutReviewVisibilityChangeSchema = z.object({
  entryId: z.string(),
  newVisibility: A3VisibilitySchema,
  reason: z.string(),
});
export type LayoutReviewVisibilityChange = z.infer<typeof LayoutReviewVisibilityChangeSchema>;

/**
 * P-55: `field` is validated at apply time against the entry's *current*
 * state (`applyTextCondensation` below), never against a fixed enum here —
 * it names either `"title"` or one of the entry's own string-valued payload
 * keys (whichever ones were long enough to list as condensable in the
 * context this diff was proposed against, see `collectCondensableFields`).
 * Condensing a *specific, semantically-known* field (e.g. always the right
 * "root cause" field for every method) would need a per-plugin
 * `condensableFields` declaration (D-125's pattern) — a second new
 * mechanism this dilim's budget doesn't cover; filed as its own gap rather
 * than built partially.
 */
export const LayoutReviewTextCondensationSchema = z.object({
  entryId: z.string(),
  field: z.string(),
  condensedText: z.string(),
  reason: z.string(),
});
export type LayoutReviewTextCondensation = z.infer<typeof LayoutReviewTextCondensationSchema>;

export const LayoutReviewDiffSchema = z.object({
  visibilityChanges: z.array(LayoutReviewVisibilityChangeSchema),
  textCondensations: z.array(LayoutReviewTextCondensationSchema),
});
export type LayoutReviewDiff = z.infer<typeof LayoutReviewDiffSchema>;

const MONTH_NAMES_TR = [
  "ocak",
  "şubat",
  "mart",
  "nisan",
  "mayıs",
  "haziran",
  "temmuz",
  "ağustos",
  "eylül",
  "ekim",
  "kasım",
  "aralık",
];
const MONTH_NAMES_EN = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];
const ALL_MONTH_NAMES = [...MONTH_NAMES_TR, ...MONTH_NAMES_EN].join("|");

const NUMBER_PATTERN = /\d[\d.,]*\d|\d/g;
const NUMERIC_DATE_PATTERN = /\b\d{1,4}[./-]\d{1,2}[./-]\d{1,4}\b/g;
const NAMED_DATE_PATTERN = new RegExp(
  `\\b\\d{1,2}\\s+(?:${ALL_MONTH_NAMES})\\s+\\d{4}\\b|\\b(?:${ALL_MONTH_NAMES})\\s+\\d{1,2},?\\s+\\d{4}\\b`,
  "gi",
);
/** A token that mixes letters and digits (a part/lot/defect-code shape), e.g. "AB-1234", "P0456". */
const PART_NUMBER_PATTERN =
  /\b(?=[A-Za-zÇĞİÖŞÜçğıöşü0-9-]*\d)(?=[A-Za-zÇĞİÖŞÜçğıöşü0-9-]*[A-Za-zÇĞİÖŞÜçğıöşü])[A-Za-zÇĞİÖŞÜçğıöşü0-9-]{3,}\b/g;
/** Two or more capitalized words in a row (Turkish-aware) — a candidate person's name. */
const NAME_PATTERN = /\b[A-ZÇĞİÖŞÜ][a-zçğıöşü]+(?:\s+[A-ZÇĞİÖŞÜ][a-zçğıöşü]+)+\b/g;

/**
 * §8.10 point 2 / §2.4: "numbers, dates, part numbers and owners are
 * protected tokens that may never be dropped or rounded." A pragmatic,
 * regex-based extractor, not an NLP model — over-matching (flagging a token
 * that wasn't actually load-bearing) only ever costs an unnecessary retry or
 * a dropped condensation line, never a wrong write, so it errs toward
 * catching more rather than less.
 */
export function extractProtectedTokens(text: string): readonly string[] {
  const tokens = new Set<string>();

  for (const match of text.matchAll(NUMBER_PATTERN)) {
    tokens.add(match[0]);
  }
  for (const match of text.matchAll(NUMERIC_DATE_PATTERN)) {
    tokens.add(match[0]);
  }
  for (const match of text.matchAll(NAMED_DATE_PATTERN)) {
    tokens.add(match[0]);
  }
  for (const match of text.matchAll(PART_NUMBER_PATTERN)) {
    tokens.add(match[0]);
  }
  for (const match of text.matchAll(NAME_PATTERN)) {
    tokens.add(match[0]);
  }

  return [...tokens];
}

/** Every protected token from `originalText` that no longer appears verbatim in `condensedText`. */
export function findMissingProtectedTokens(originalText: string, condensedText: string): readonly string[] {
  return extractProtectedTokens(originalText).filter((token) => !condensedText.includes(token));
}

// ---------------------------------------------------------------------------
// Context building (§2.2)
// ---------------------------------------------------------------------------

const MAX_ENTRY_SUMMARY_CHARS = 400;
const MIN_CONDENSABLE_FIELD_CHARS = 80;
const CONDENSABLE_FIELD_CAP_CHARS = 1200;
/** A generous character budget, not a token count — this environment has no tokenizer on the TS side; Rust/Vorion's own request still enforces the real limit. */
const MAX_CONTEXT_CHARS = 20000;

export interface CondensableField {
  readonly field: string;
  readonly text: string;
}

/**
 * Generic, method-agnostic: `Entry.payload` is opaque at the domain level
 * (D-52), but at runtime it is always a plain object for every real method
 * schema — this reads it as "an object with some string-valued keys,"
 * without knowing or caring what any of them *mean*. The same posture
 * `RowTableEditor.tsx`'s `row[column.key] ?? ""` already takes one layer
 * over (C1/D-180).
 */
export function collectCondensableFields(entry: Entry): readonly CondensableField[] {
  const fields: CondensableField[] = [];
  if (entry.title.trim().length > 0) {
    fields.push({ field: "title", text: entry.title });
  }
  const payload = entry.payload;
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
      if (typeof value === "string" && value.length >= MIN_CONDENSABLE_FIELD_CHARS) {
        fields.push({ field: key, text: value.slice(0, CONDENSABLE_FIELD_CAP_CHARS) });
      }
    }
  }
  return fields;
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export interface EntryLookupEntry {
  readonly stepId: StepId;
  readonly step: StepState;
  readonly entry: Entry;
}

/** Built once per Review-tab session and reused for both context-building and applying accepted changes. */
export function buildEntryLookup(project: ProjectModel): ReadonlyMap<string, EntryLookupEntry> {
  const map = new Map<string, EntryLookupEntry>();
  for (const stepId of STEP_IDS) {
    const step = project.steps[stepId];
    if (!step) {
      continue;
    }
    for (const entry of step.entries) {
      map.set(entry.id, { stepId, step, entry });
    }
  }
  return map;
}

/** The current text of one condensable field, re-read live so a protected-token check never compares against a stale snapshot. `undefined` when the entry or field no longer exists. */
export function lookupCondensableText(
  lookup: ReadonlyMap<string, EntryLookupEntry>,
  entryId: string,
  field: string,
): string | undefined {
  const found = lookup.get(entryId);
  if (!found) {
    return undefined;
  }
  if (field === "title") {
    return found.entry.title;
  }
  const payload = found.entry.payload;
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const value = (payload as Record<string, unknown>)[field];
    return typeof value === "string" ? value : undefined;
  }
  return undefined;
}

export interface LayoutReviewContext {
  readonly contextText: string;
  /** §8.14: "reduce context slices in a defined priority order, tell the user what was dropped, never silently truncate." Empty when nothing needed to shrink. */
  readonly droppedNotes: readonly string[];
}

/**
 * §2.2: builds the whole-project summary Vorion sees — every entry's title/
 * visibility/short content summary (for the primary/appendix judgment), which
 * blocks are over budget (reusing `buildA3Layout`'s own `overflowWarnings`,
 * never recomputed), and, for entries inside an over-budget block, their
 * actual condensable field text (for the condensation judgment).
 */
export function buildLayoutReviewContext(
  project: ProjectModel,
  descriptor: A3LayoutDescriptor,
  rendererMap: A3EntryRendererMap,
): LayoutReviewContext {
  const overflowingStepIds = new Set<StepId>();
  for (const warning of descriptor.overflowWarnings) {
    for (const stepId of warning.stepIds) {
      overflowingStepIds.add(stepId);
    }
  }

  interface EntryRow {
    readonly stepId: StepId;
    readonly entry: Entry;
    readonly summary: string;
    readonly hasChart: boolean;
  }

  const rows: EntryRow[] = [];
  const condensableSections: string[] = [];

  for (const stepId of STEP_IDS) {
    const step = project.steps[stepId];
    if (!step) {
      continue;
    }
    for (const entry of step.entries) {
      const { summary: summaryText, hasChart } = summarizeEntryForAi(entry, project.meta.language, rendererMap);
      rows.push({ stepId, entry, summary: summaryText, hasChart });

      if (overflowingStepIds.has(stepId) && entry.a3Visibility === "primary") {
        const condensable = collectCondensableFields(entry);
        if (condensable.length > 0) {
          const fieldLines = condensable.map((f) => `  [field="${f.field}"] ${f.text}`).join("\n");
          condensableSections.push(`entryId "${entry.id}" (Step ${stepId}, method: ${entry.methodId}):\n${fieldLines}`);
        }
      }
    }
  }

  const budgetLines = descriptor.overflowWarnings.map(
    (w) =>
      `Step(s) ${w.stepIds.join(", ")} block is over its printed budget by ${Math.round(w.overflowByPt)}pt ` +
      `(budget ${Math.round(w.budgetPt)}pt, content ${Math.round(w.contentPt)}pt).` +
      (w.droppedEntryIds.length > 0
        ? ` Entries already dropped to an appendix by automatic overflow: ${w.droppedEntryIds.join(", ")}.`
        : ""),
  );

  function formatEntryRow(row: EntryRow, summaryMax: number): string {
    return (
      `Step ${row.stepId} — entryId "${row.entry.id}" (method: ${row.entry.methodId}, ` +
      `visibility: ${row.entry.a3Visibility}${row.hasChart ? ", has chart" : ""}): ` +
      truncate(row.summary, summaryMax)
    );
  }

  function assemble(entryLines: readonly string[], sections: readonly string[]): string {
    return [
      "## All project entries",
      entryLines.join("\n") || "(no entries yet)",
      "",
      "## Blocks over their printed cell budget",
      budgetLines.join("\n") || "(no block is currently over budget)",
      "",
      "## Condensable content for entries in over-budget blocks",
      sections.join("\n\n") || "(nothing to condense)",
    ].join("\n");
  }

  const droppedNotes: string[] = [];
  let contextText = assemble(
    rows.map((row) => formatEntryRow(row, MAX_ENTRY_SUMMARY_CHARS)),
    condensableSections,
  );

  // §8.14, tier 1: a `hidden` entry contributes nothing to the primary/
  // appendix narrative judgment beyond "it exists and is hidden" — drop its
  // content summary first, the least costly thing to lose.
  if (contextText.length > MAX_CONTEXT_CHARS) {
    const hiddenCount = rows.filter((row) => row.entry.a3Visibility === "hidden").length;
    if (hiddenCount > 0) {
      const shortenedLines = rows.map((row) =>
        row.entry.a3Visibility === "hidden"
          ? `Step ${row.stepId} — entryId "${row.entry.id}" (method: ${row.entry.methodId}, visibility: hidden)`
          : formatEntryRow(row, MAX_ENTRY_SUMMARY_CHARS),
      );
      contextText = assemble(shortenedLines, condensableSections);
      droppedNotes.push(
        `${hiddenCount} hidden entr${hiddenCount === 1 ? "y's" : "ies'"} content summaries were dropped to fit the AI's context window — only their step and method were kept.`,
      );
    }
  }

  // §8.14, tier 2 (last resort): hard-truncate. This must never happen
  // silently — the note below is the one the Review tab surfaces.
  if (contextText.length > MAX_CONTEXT_CHARS) {
    contextText = contextText.slice(0, MAX_CONTEXT_CHARS);
    droppedNotes.push(
      "This project is large enough that some content was cut off entirely before sending it to the AI — review its suggestions carefully, and consider running the review again after moving some entries to the appendix by hand.",
    );
  }

  return { contextText, droppedNotes };
}

// ---------------------------------------------------------------------------
// Proposal orchestration (§2.4: schema validation + protected-token check,
// one combined retry)
// ---------------------------------------------------------------------------

export interface ProtectedTokenFailure {
  readonly entryId: string;
  readonly field: string;
  readonly missingTokens: readonly string[];
}

function findProtectedTokenFailures(
  condensations: readonly LayoutReviewTextCondensation[],
  lookup: ReadonlyMap<string, EntryLookupEntry>,
): readonly ProtectedTokenFailure[] {
  const failures: ProtectedTokenFailure[] = [];
  for (const line of condensations) {
    const original = lookupCondensableText(lookup, line.entryId, line.field);
    if (original === undefined) {
      continue;
    }
    const missing = findMissingProtectedTokens(original, line.condensedText);
    if (missing.length > 0) {
      failures.push({ entryId: line.entryId, field: line.field, missingTokens: missing });
    }
  }
  return failures;
}

function lineKey(entryId: string, field: string): string {
  return `${entryId} ${field}`;
}

function buildLayoutReviewRetryPrompt(
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
        `- entryId "${f.entryId}", field "${f.field}": lost protected value(s) ${f.missingTokens.map((t) => `"${t}"`).join(", ")} — restore them in the condensed text.`,
    );
    parts.push(`\n\nSome condensations dropped protected numbers, dates, part numbers or names:\n${lines.join("\n")}`);
  }
  parts.push(
    "\n\nCorrect these issues and respond again with ONLY valid JSON matching the schema — no prose, no markdown code fences.",
  );
  return parts.join("");
}

export type LayoutReviewOutcome =
  | { readonly outcome: "success"; readonly diff: LayoutReviewDiff; readonly droppedNotes: readonly string[] }
  | { readonly outcome: "failed"; readonly rawText: string };

export interface ProposeLayoutReviewParams {
  readonly promptBody: string;
  readonly contextText: string;
  readonly modelId: string;
  readonly redaction: ResolvedRedactionPolicy;
  readonly lookup: ReadonlyMap<string, EntryLookupEntry>;
  readonly projectId: string;
  readonly promptVersion: string | null;
}

/**
 * §2.4/D-204's retry-once discipline, applied to two failure classes at
 * once: a schema-invalid response and a response that lost a protected
 * token both count as "the attempt failed," and both get exactly one
 * combined retry (never two independent retries stacked — that would be up
 * to 4 calls for what SPEC.md calls "retry once"). If the retry's response
 * is schema-valid but *specific lines* still lose a protected token, only
 * those lines are dropped from the diff — the rest of the diff still ships,
 * matching "content is never deleted... a condensation is either applied
 * safely or not applied at all."
 */
export async function proposeLayoutReviewDiff(params: ProposeLayoutReviewParams): Promise<LayoutReviewOutcome> {
  const jsonSchema = z.toJSONSchema(LayoutReviewDiffSchema, { target: "draft-2020-12" });
  const firstPrompt = buildProposalPrompt(params.promptBody, params.contextText);

  const first = await attemptStructuredProposal(
    firstPrompt,
    jsonSchema,
    params.modelId,
    LayoutReviewDiffSchema,
    params.redaction,
    params.projectId,
    params.promptVersion,
  );

  if (!first.success) {
    return retryOnce(params, jsonSchema, first.rawText, first.errorSummary, []);
  }

  const diff = first.value as LayoutReviewDiff;
  const failures = findProtectedTokenFailures(diff.textCondensations, params.lookup);
  if (failures.length === 0) {
    return { outcome: "success", diff, droppedNotes: [] };
  }

  return retryOnce(params, jsonSchema, JSON.stringify(diff, null, 2), undefined, failures);
}

async function retryOnce(
  params: ProposeLayoutReviewParams,
  jsonSchema: object,
  previousRawText: string,
  schemaErrorSummary: string | undefined,
  tokenFailures: readonly ProtectedTokenFailure[],
): Promise<LayoutReviewOutcome> {
  const retryPrompt = buildLayoutReviewRetryPrompt(
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
    LayoutReviewDiffSchema,
    params.redaction,
    params.projectId,
    params.promptVersion,
  );

  if (!second.success) {
    return { outcome: "failed", rawText: second.rawText };
  }

  const diff = second.value as LayoutReviewDiff;
  const stillFailing = findProtectedTokenFailures(diff.textCondensations, params.lookup);
  if (stillFailing.length === 0) {
    return { outcome: "success", diff, droppedNotes: [] };
  }

  const failingKeys = new Set(stillFailing.map((f) => lineKey(f.entryId, f.field)));
  const keptCondensations = diff.textCondensations.filter((line) => !failingKeys.has(lineKey(line.entryId, line.field)));
  const droppedNotes = stillFailing.map(
    (f) =>
      `A condensation for entry "${f.entryId}" (field "${f.field}") could not preserve ${f.missingTokens.map((t) => `"${t}"`).join(", ")} — it was left out, the text is unchanged.`,
  );

  return { outcome: "success", diff: { ...diff, textCondensations: keptCondensations }, droppedNotes };
}

/**
 * §2.6: applying a `visibilityChanges` line dispatches the same
 * `buildSetA3VisibilityCommand` a manual click in `EntryRow` already uses,
 * and never touches `Provenance` — a visibility change is a routing
 * decision, not a content-authorship claim (D-100's own framing: reversible,
 * never a content change). Applying a `textCondensations` line, by
 * contrast, genuinely rewrites content the AI proposed, so it *does* carry
 * `Provenance` — both are implemented directly in `LayoutReviewPanel.tsx`
 * (the same split `EntryRow`'s visibility select vs. `EntryProposalField`'s
 * Accept button already draws, one level up).
 */
