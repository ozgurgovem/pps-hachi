import type { A3BlockContent, A3EntrySummary } from "../../a3/methodContract";
import type { ParetoPayload } from "./schema";

/** Rows reserved for the chart image, leaving room for other Step 2 entries in the same block. */
const CHART_ROW_SPAN = 10;

export function renderParetoToA3(payload: ParetoPayload, entry: A3EntrySummary): A3BlockContent {
  return {
    lines: [{ text: entry.title, bold: true }],
    image: {
      kind: "pareto-chart",
      rowSpan: CHART_ROW_SPAN,
      spec: {
        kind: "pareto",
        unit: payload.unit,
        items: payload.categories.map((category) => ({ label: category.label, count: category.count })),
      },
    },
  };
}
