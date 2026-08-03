import type { A3BlockContent, A3EntrySummary } from "../../a3/methodContract";
import type { TrendPayload } from "./schema";

const CHART_ROW_SPAN = 10;

export function renderTrendToA3(payload: TrendPayload, entry: A3EntrySummary): A3BlockContent {
  return {
    lines: [{ text: entry.title, bold: true }],
    image: {
      kind: "trend-chart",
      rowSpan: CHART_ROW_SPAN,
      spec: {
        kind: "trend",
        unit: payload.unit,
        points: payload.points.map((point) => ({ label: point.label, value: point.value })),
        targetValue: payload.targetValue,
        targetLabel: payload.targetLabel,
        events: payload.events,
      },
    },
  };
}
