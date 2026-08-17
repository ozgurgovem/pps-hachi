import { createElement } from "react";
import type { TrendChartSpec } from "../chartSpec";
import type { MethodPlugin } from "../types";
import { TrendChart } from "./TrendChart";
import { TrendEditor } from "./Editor";
import { renderTrendToA3 } from "./renderToA3";
import { TrendPayloadSchema, type TrendPayload } from "./schema";

export const TREND_METHOD_ID = "trend";

export const trendMethod: MethodPlugin<TrendPayload> = {
  id: TREND_METHOD_ID,
  steps: [2],
  tier: "recommended",
  nameKey: "methods.trend.name",
  useWhenKey: "methods.trend.useWhen",
  schema: TrendPayloadSchema,
  Editor: TrendEditor,
  createEmptyPayload: () => ({ unit: "", points: [], events: [] }),
  renderToA3: renderTrendToA3,
  imageKind: "trend-chart",
  renderImage: (spec, size) => createElement(TrendChart, { spec: spec as TrendChartSpec, size }),
};
