import { createElement } from "react";
import type { TrajectoryChartSpec } from "../chartSpec";
import type { MethodPlugin } from "../types";
import { TrajectoryChart } from "./TrajectoryChart";
import { SmartTargetEditor } from "./Editor";
import { renderSmartTargetToA3 } from "./renderToA3";
import { SmartTargetPayloadSchema, type SmartTargetPayload } from "./schema";

export const SMART_TARGET_METHOD_ID = "smart-target";

export const smartTargetMethod: MethodPlugin<SmartTargetPayload> = {
  id: SMART_TARGET_METHOD_ID,
  steps: [3],
  tier: "recommended",
  nameKey: "methods.smartTarget.name",
  useWhenKey: "methods.smartTarget.useWhen",
  schema: SmartTargetPayloadSchema,
  Editor: SmartTargetEditor,
  createEmptyPayload: () => ({
    metric: "",
    baseline: 0,
    target: 0,
    unit: "",
    dueDate: "",
    owner: "",
    prioritizedItems: [],
    stakeholderNote: "",
  }),
  renderToA3: renderSmartTargetToA3,
  imageKind: "trajectory-chart",
  renderImage: (spec, size) =>
    createElement(TrajectoryChart, { spec: spec as TrajectoryChartSpec, size }),
  aiProposal: { promptVersion: "v1" },
};
