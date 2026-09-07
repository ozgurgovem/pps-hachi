import type { A3BlockContent, A3ContentZone, A3EntrySummary, A3Language } from "../../a3/methodContract";
import { resolveA3Language } from "../../a3/methodContract";
import type { GapStatementPayload } from "./schema";

/** D-188/P-26: matches `methods.gapStatement.{ideal,actual,gap}Label`'s own editor translations. */
const IDEAL_LABEL: Readonly<Record<A3Language, string>> = { tr: "İdeal", en: "Ideal" };
const ACTUAL_LABEL: Readonly<Record<A3Language, string>> = { tr: "Mevcut", en: "Actual" };
const GAP_LABEL: Readonly<Record<A3Language, string>> = { tr: "Boşluk", en: "Gap" };

const GAP_ANALYSIS_HEADER: Readonly<Record<A3Language, string>> = { tr: "1.2 Gap Analizi", en: "1.2 Gap Analysis" };
const PROBLEM_STATEMENT_HEADER: Readonly<Record<A3Language, string>> = {
  tr: "1.3 Problem Statement",
  en: "1.3 Problem Statement",
};

/**
 * Barış's own call (AskUserQuestion, this dilim): no fabricated numeric
 * "Current vs Ideal" bar chart — `ideal`/`actual` are free text, not
 * numbers, and D-162 (LOCKED) forbids adding numeric companion fields this
 * dilim. Instead, a plain-language summary built only from fields that
 * already exist: the free-text `gap` description (or, lacking that, the
 * bare `gapValue`/`unit`) plus the `baselinePeriod` in parentheses — e.g.
 * "3 PPM above ideal (Q2 2026)". Empty when nothing is filled in yet.
 */
function gapHeadline(payload: GapStatementPayload): string {
  const magnitude = payload.gapValue !== 0 ? `${payload.gapValue} ${payload.unit}`.trim() : "";
  const core = payload.gap.trim() || magnitude;
  if (!core) {
    return "";
  }
  const period = payload.baselinePeriod.trim();
  return period ? `${core} (${period})` : core;
}

const BLANK_PLACEHOLDER = "—";

/**
 * TEMPLATE_ANALYSIS.md §14.2 (D-159 LOCKED, D-223): ADIM 1's two mandatory
 * `gapStatement` panels, one entry, `zones` (D-102's mechanism — `smartTarget`
 * and `fiveN1K` are its first two users, this is the third). Left half is a
 * plain-language gap summary (no chart — see `gapHeadline`'s own note);
 * right half is D-165's three Layer A goal-state bands, coloured via
 * `fillStyleId` (D-224) rather than `tone`, since these are fixed template
 * fill styles, not P-37's inline font-colour reinforcement. `lines: []`
 * (matching `smartTarget`/`fiveN1K`'s own convention) — an appendixed copy
 * of this entry (D-100) reads from `flattenContentForAppendix`'s own
 * zone-flattening, not a separately-maintained duplicate list.
 *
 * `zonesRowSpan: 8` (D-224) is required, not decorative — without it this
 * zoned entry would consume the *whole* rest of ADIM 1's block, dropping
 * whichever of `fiveN1K`/`gapStatement` the user happens to have entered
 * second. The schema itself (`GapStatementPayloadSchema`) is untouched, per
 * D-162.
 */
export function renderGapStatementToA3(payload: GapStatementPayload, entry: A3EntrySummary): A3BlockContent {
  const language = resolveA3Language(entry);

  const headline = gapHeadline(payload);
  const gapZone: A3ContentZone = {
    widthFraction: 0.5,
    lines: [
      { text: `${GAP_ANALYSIS_HEADER[language]} — ${entry.title}`, bold: true },
      ...(headline ? [{ text: headline, bold: true }] : []),
      ...(payload.ideal.trim() ? [{ text: `${IDEAL_LABEL[language]}: ${payload.ideal}` }] : []),
      ...(payload.actual.trim() ? [{ text: `${ACTUAL_LABEL[language]}: ${payload.actual}` }] : []),
    ],
  };

  const problemStatementZone: A3ContentZone = {
    widthFraction: 0.5,
    lines: [
      { text: PROBLEM_STATEMENT_HEADER[language], bold: true },
      {
        text: `${IDEAL_LABEL[language]}: ${payload.ideal.trim() || BLANK_PLACEHOLDER}`,
        fillStyleId: "bandPositive",
      },
      {
        text: `${ACTUAL_LABEL[language]}: ${payload.actual.trim() || BLANK_PLACEHOLDER}`,
        fillStyleId: "bandCaution",
      },
      {
        text: `${GAP_LABEL[language]}: ${payload.gap.trim() || BLANK_PLACEHOLDER}`,
        fillStyleId: "bandNegative",
      },
    ],
  };

  return {
    lines: [],
    zones: [gapZone, problemStatementZone],
    zonesRowSpan: 8,
  };
}
