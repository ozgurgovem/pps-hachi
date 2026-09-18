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
 * step's own live block preview, with no visible warning. The row-span
 * fix that followed (8, summing with `fiveN1K`'s own 4 to exactly ADIM
 * 1's default 12 rows) traded that outage for a different, real cost —
 * both images were noticeably more compact than the BVVL loop's own
 * approved mockups, since stacking meant each image got only a slice of
 * the block's full height.
 *
 * ADIM 1 side-by-side round (2026-09-17): `place.ts`'s new
 * `A3BlockContent.widthFraction` mechanism lets `gapStatement`/`fiveN1K`
 * sit next to each other instead of stacked — each now uses the block's
 * FULL row height while only sharing its width. This is both more
 * compact-image-free (no stacking penalty) AND still unconditional —
 * neither entry depends on elastic growth or an empty neighbour, matching
 * the same reliability guarantee the row-span fix already established.
 *
 * Real-app regression, round 7 (2026-09-17, Barış's own live block
 * preview screenshot): a fixed `rowSpan: 12` reserves exactly 12 rows —
 * correct for ADIM 1's own STATIC default, but ADIM 1 also declares
 * `elastic: { minimumCanvasRows: 10 }` (Faz 11/L3a, D-158/D-160), and a
 * near-empty ADIM 2/3 lets it grow the block FAR past 12 rows. The two
 * images stayed pinned to their old fixed 12-row footprint regardless,
 * leaving the rest of a much taller live block empty — exactly the huge
 * blank area under two tiny charts in Barış's own screenshot.
 * `content.image.rowSpan` left OMITTED (not a magic number) makes
 * `place.ts` size the image to whatever the block's own real,
 * post-elastic `contentRows` range actually is (`imageRowSpan =
 * lastRow - startRow + 1`, `place.ts`'s own established default for a
 * `rowSpan`-less image) — self-bounding by construction (it can never
 * request more rows than the block's own real end, so this cannot
 * reintroduce the original stacked-and-dropped regression), and it now
 * genuinely grows with the block instead of floating in a fixed corner
 * of it.
 *
 * Real-app regression, round 8 (2026-09-17, Barış's own live block preview
 * screenshot): an omitted `rowSpan` reports `Number.POSITIVE_INFINITY`
 * demand to the elastic solver (`elasticAllocation.ts`) — with ADIM 2/3
 * genuinely near-empty in Barış's real project, ADIM 1 greedily absorbed
 * the ENTIRE column's surplus, producing a much taller block than either
 * chart's own internal layout actually needed — a huge blank area under
 * two still-modestly-sized charts, not the "grows to fill it" fix round 7
 * intended. `MAX_DEMAND_ROW_SPAN` caps the SOLVER'S demand at a finite,
 * deliberately generous target (double the static default) while
 * `rowSpan` itself stays omitted — placement still self-bounds to
 * whatever the block actually resolves to (never smaller, never able to
 * overflow it), so the block now grows up to a reasonable size and stops,
 * leaving any further surplus for other blocks instead of consuming it all.
 */
const MAX_DEMAND_ROW_SPAN = 24;

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
    image: { kind: "gap-analysis-chart", spec, maxDemandRowSpan: MAX_DEMAND_ROW_SPAN },
    widthFraction: 0.5,
  };
}
