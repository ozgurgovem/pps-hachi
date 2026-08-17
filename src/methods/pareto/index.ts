import { createElement } from "react";
import type { ParetoChartSpec } from "../chartSpec";
import type { MethodPlugin } from "../types";
import { ParetoChart } from "./ParetoChart";
import { ParetoEditor } from "./Editor";
import { renderParetoToA3 } from "./renderToA3";
import { ParetoPayloadSchema, type ParetoPayload } from "./schema";

export const PARETO_METHOD_ID = "pareto";

export const paretoMethod: MethodPlugin<ParetoPayload> = {
  id: PARETO_METHOD_ID,
  steps: [2],
  tier: "recommended",
  nameKey: "methods.pareto.name",
  useWhenKey: "methods.pareto.useWhen",
  schema: ParetoPayloadSchema,
  Editor: ParetoEditor,
  createEmptyPayload: () => ({ unit: "", categories: [] }),
  renderToA3: renderParetoToA3,
  imageKind: "pareto-chart",
  renderImage: (spec, size) => createElement(ParetoChart, { spec: spec as ParetoChartSpec, size }),
};
