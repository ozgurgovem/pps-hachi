import { createElement } from "react";
import type { BoxPlotChartSpec, HistogramChartSpec, ScatterChartSpec } from "../chartSpec";
import type { MethodPlugin } from "../types";
import { DistributionChart } from "./DistributionChart";
import { DistributionChartEditor } from "./Editor";
import { renderDistributionChartToA3 } from "./renderToA3";
import { DistributionChartPayloadSchema, type DistributionChartPayload } from "./schema";

export const DISTRIBUTION_CHART_METHOD_ID = "distribution-chart";

export const distributionChartMethod: MethodPlugin<DistributionChartPayload> = {
  id: DISTRIBUTION_CHART_METHOD_ID,
  steps: [2],
  nameKey: "methods.distributionChart.name",
  useWhenKey: "methods.distributionChart.useWhen",
  schema: DistributionChartPayloadSchema,
  Editor: DistributionChartEditor,
  createEmptyPayload: () => ({ chartType: "histogram", unit: "", binCount: "", samples: [], points: [] }),
  renderToA3: renderDistributionChartToA3,
  imageKind: "distribution-chart",
  renderImage: (spec, size) =>
    createElement(DistributionChart, {
      spec: spec as HistogramChartSpec | ScatterChartSpec | BoxPlotChartSpec,
      size,
    }),
};
