import type { A3BlockContent, A3EntrySummary, A3Language } from "../../a3/methodContract";
import { resolveA3Language } from "../../a3/methodContract";
import type { DistributionChartPayload } from "./schema";
import { parsePoints, parseSampleValues } from "./stats";

/** Rows reserved for the chart image — matches `pareto`/`trend`'s CHART_ROW_SPAN. */
const CHART_ROW_SPAN = 10;

/** D-188/P-26: the box plot's single-bar axis label when the user left `unit` blank — genuinely visible on the chart, unlike histogram/scatter's Tooltip-only fallbacks. */
const VALUE_LABEL: Readonly<Record<A3Language, string>> = { tr: "Değer", en: "Value" };

function buildSpec(payload: DistributionChartPayload, language: A3Language) {
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
    unit: payload.unit || VALUE_LABEL[language],
    values,
  };
}

export function renderDistributionChartToA3(payload: DistributionChartPayload, entry: A3EntrySummary): A3BlockContent {
  return {
    lines: [{ text: entry.title, bold: true }],
    image: {
      kind: "distribution-chart",
      rowSpan: CHART_ROW_SPAN,
      spec: buildSpec(payload, resolveA3Language(entry)),
    },
  };
}
