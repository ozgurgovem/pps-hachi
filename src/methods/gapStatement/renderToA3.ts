import type { A3BlockContent, A3EntrySummary, A3Language } from "../../a3/methodContract";
import { resolveA3Language } from "../../a3/methodContract";
import type { GapAnalysisChartSpec } from "../chartSpec";
import type { GapStatementPayload } from "./schema";

/** D-188/P-26: matches `methods.gapStatement.{idealBar,actualBar,problemStatement,deviation}Label`'s own editor translations. */
const IDEAL_BAR_LABEL: Readonly<Record<A3Language, string>> = { tr: "İdeal Durum", en: "Ideal State" };
const ACTUAL_BAR_LABEL: Readonly<Record<A3Language, string>> = { tr: "Mevcut Durum", en: "Current State" };
const PROBLEM_STATEMENT_LABEL: Readonly<Record<A3Language, string>> = { tr: "Problem Tanımı", en: "Problem Statement" };
const DEVIATION_LABEL: Readonly<Record<A3Language, string>> = { tr: "Hedeften Sapma", en: "Deviation from Target" };
const CHART_TITLE: Readonly<Record<A3Language, string>> = { tr: "GAP ANALİZİ", en: "GAP ANALYSIS" };

const BLANK_PLACEHOLDER = "—";

function bandLine(label: string, value: string): string {
  const trimmed = value.trim();
  return `${label}: ${trimmed || BLANK_PLACEHOLDER}`;
}

/**
 * ADIM 1 BVVL round (2026-09-16/17, four rounds of visual review against
 * the real EK-2905 workbook's own "GAP ANALİZİ" chart + three Layer A
 * bands): replaces D-224's earlier two-zone text panel (which duplicated
 * the same ideal/actual/gap information in two places and carried a
 * hardcoded-English "Problem Statement" header regardless of language,
 * D-43's own rule). Chart and bands are now ONE image
 * (`gap-analysis-chart`) — `place.ts` always merges a `lines` cell to the
 * block's full width, so keeping the three bands as separate cells could
 * never actually share a width with a narrower chart image; drawing both
 * inside one component (`GapAnalysisChart.tsx`) makes "same width"
 * structural rather than something two layout primitives have to agree on.
 *
 * Real-app regression (2026-09-17, Barış's own trial run): an earlier
 * version of this constant (11, reasoned from `buildA3Layout`'s own
 * *best-case* elastic ceiling — empty ADIM 2/3) shipped, and in Barış's
 * real project (non-empty neighbours, ordinary elastic slack) the sibling
 * `fiveN1K` entry was silently dropped to the appendix — invisible in the
 * step's own live block preview, with no visible warning — and this
 * chart's own block ballooned from elastic growth, showing tiny in the
 * same fixed-height preview. `CHART_ROW_SPAN` + `fiveN1K/renderToA3.ts`'s
 * own `DIAGRAM_ROW_SPAN` now sum to exactly 12 — ADIM 1's own *default*
 * row count (`pps-8step-auto.ts`'s own `contentRows`), so both entries
 * fit **unconditionally**, with zero reliance on elastic growth or
 * cooperative neighbours — the same total budget D-224's own
 * `zonesRowSpan` split (8+4) already proved reliable. The visual cost is
 * real: both images are now noticeably more compact than the BVVL loop's
 * own approved mockups. Flagged back to Barış rather than silently
 * accepted — his own side-by-side placement idea (packing entries
 * horizontally within a block, not just vertically) could recover the
 * lost size without growing the row budget, but is a real new placement
 * mechanism, not a same-session fix.
 */
const CHART_ROW_SPAN = 8;

export function renderGapStatementToA3(payload: GapStatementPayload, entry: A3EntrySummary): A3BlockContent {
  const language = resolveA3Language(entry);

  // D-52: `payload` is never Zod-validated on load — an entry persisted
  // before this dilim added idealValue/actualValue/targetDate has them
  // genuinely `undefined` at runtime despite the TS type, the same class
  // of gap C1/D-180 already fixed once for `RowTableEditor`.
  const spec: GapAnalysisChartSpec = {
    kind: "gap-analysis",
    title: CHART_TITLE[language],
    unit: payload.unit ?? "",
    actualValue: payload.actualValue ?? 0,
    idealValue: payload.idealValue ?? 0,
    actualBarLabel: ACTUAL_BAR_LABEL[language],
    idealBarLabel: IDEAL_BAR_LABEL[language],
    actualDate: (payload.baselinePeriod ?? "").trim(),
    idealDate: (payload.targetDate ?? "").trim(),
    deviationLabel: DEVIATION_LABEL[language],
    bandTexts: [
      bandLine(IDEAL_BAR_LABEL[language], payload.ideal),
      bandLine(ACTUAL_BAR_LABEL[language], payload.actual),
      bandLine(PROBLEM_STATEMENT_LABEL[language], payload.gap),
    ],
  };

  return {
    lines: [],
    image: { kind: "gap-analysis-chart", rowSpan: CHART_ROW_SPAN, spec },
  };
}
