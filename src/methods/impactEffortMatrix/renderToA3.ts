import type { A3BlockContent, A3EntrySummary, A3TextLine } from "../../a3/methodContract";
import { resolveA3Language } from "../../a3/methodContract";
import type { ImpactEffortChartSpec } from "../chartSpec";
import { AXIS_EXPORT_LABELS, QUADRANT_EXPORT_LABELS, quadrantOf, scoreValue } from "./quadrant";
import type { ImpactEffortMatrixPayload } from "./schema";

/**
 * P-27: Step 5 is `pps-8step-auto`'s own elastic block with a small (4-row)
 * default/minimum canvas (D-158/D-160) — much tighter than Pareto/Trend's
 * Step-2 `CHART_ROW_SPAN=10` (Step 2's own minimum is 18). A smaller
 * reservation here keeps the common case from unconditionally overflowing
 * to an appendix, the same reasoning `kpiStrip/renderToA3.ts`'s own
 * `CHART_ROW_SPAN=6` comment gives for its tight-canvas block.
 */
const CHART_ROW_SPAN = 6;

export function renderImpactEffortMatrixToA3(
  payload: ImpactEffortMatrixPayload,
  entry: A3EntrySummary,
): A3BlockContent {
  const language = resolveA3Language(entry);
  const itemLines: A3TextLine[] = payload.items
    .filter((item) => item.description.trim().length > 0)
    .map((item) => {
      const quadrant = quadrantOf(item);
      const description = item.description.trim();
      return { text: quadrant ? `${description} — ${QUADRANT_EXPORT_LABELS[quadrant][language]}` : description };
    });

  const chartItems = payload.items
    .filter((item) => item.description.trim().length > 0)
    .flatMap((item) => {
      const impact = scoreValue(item.impact);
      const effort = scoreValue(item.effort);
      const quadrant = quadrantOf(item);
      if (impact === undefined || effort === undefined || quadrant === undefined) {
        return [];
      }
      return [{ label: item.description.trim(), impact, effort, quadrant }];
    });

  const spec: ImpactEffortChartSpec = {
    kind: "impact-effort",
    items: chartItems,
    xLabel: AXIS_EXPORT_LABELS.effort[language],
    yLabel: AXIS_EXPORT_LABELS.impact[language],
  };

  return {
    lines: [{ text: entry.title, bold: true }, ...itemLines],
    image: { kind: "impact-effort-chart", rowSpan: CHART_ROW_SPAN, spec },
  };
}
