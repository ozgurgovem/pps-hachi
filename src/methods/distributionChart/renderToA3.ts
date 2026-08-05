import type { A3BlockContent, A3EntrySummary } from "../../a3/methodContract";
import type { DistributionChartPayload } from "./schema";
import { parsePoints, parseSampleValues } from "./stats";

/** Rows reserved for the chart image — matches `pareto`/`trend`'s CHART_ROW_SPAN. */
const CHART_ROW_SPAN = 10;

function buildSpec(payload: DistributionChartPayload) {
  if (payload.chartType === "scatter") {
    return {
      kind: "scatter" as const,
      xLabel: payload.unit || undefined,
      points: parsePoints(payload.points),
    };
  }
  const values = parseSampleValues(payload.samples);
  const binCount = Number(payload.binCount.trim());
  if (payload.chartType === "histogram") {
    return {
      kind: "histogram" as const,
      unit: payload.unit || undefined,
      values,
      binCount: Number.isFinite(binCount) && binCount > 0 ? binCount : undefined,
    };
  }
  return {
    kind: "box-plot" as const,
    unit: payload.unit || undefined,
    values,
  };
}

export function renderDistributionChartToA3(payload: DistributionChartPayload, entry: A3EntrySummary): A3BlockContent {
  return {
    lines: [{ text: entry.title, bold: true }],
    image: {
      kind: "distribution-chart",
      rowSpan: CHART_ROW_SPAN,
      spec: buildSpec(payload),
    },
  };
}
