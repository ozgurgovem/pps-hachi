import { createElement } from "react";
import type { KpiStripChartSpec } from "../chartSpec";
import type { MethodPlugin } from "../types";
import { KpiStripChart } from "./KpiStripChart";
import { KpiStripEditor } from "./Editor";
import { renderKpiStripToA3 } from "./renderToA3";
import { KpiStripPayloadSchema, type KpiStripPayload } from "./schema";

export const KPI_STRIP_METHOD_ID = "kpi-strip";

/**
 * TEMPLATE_ANALYSIS.md §14.3, DECISIONS.md D-167/D-177: ADIM 7's first real
 * plugin — Step 7 had zero dedicated methods before this (only `genericText`
 * via `STEP_IDS`). `id === imageKind` mirrors `distributionChart`'s own
 * naming, this slice's nearest precedent for a brand-new `A3ImageKind` +
 * `ChartSpec` variant + method landing together (D-114/D-141).
 */
export const kpiStripMethod: MethodPlugin<KpiStripPayload> = {
  id: KPI_STRIP_METHOD_ID,
  steps: [7],
  tier: "recommended",
  nameKey: "methods.kpiStrip.name",
  useWhenKey: "methods.kpiStrip.useWhen",
  schema: KpiStripPayloadSchema,
  Editor: KpiStripEditor,
  createEmptyPayload: () => ({ items: [] }),
  renderToA3: renderKpiStripToA3,
  imageKind: "kpi-strip",
  renderImage: (spec, size) => createElement(KpiStripChart, { spec: spec as KpiStripChartSpec, size }),
};
