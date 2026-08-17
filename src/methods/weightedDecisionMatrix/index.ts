import type { MethodPlugin } from "../types";
import { WeightedDecisionMatrixEditor } from "./Editor";
import { renderWeightedDecisionMatrixToA3 } from "./renderToA3";
import { WeightedDecisionMatrixPayloadSchema, type WeightedDecisionMatrixPayload } from "./schema";

export const WEIGHTED_DECISION_MATRIX_METHOD_ID = "weighted-decision-matrix";

export const weightedDecisionMatrixMethod: MethodPlugin<WeightedDecisionMatrixPayload> = {
  id: WEIGHTED_DECISION_MATRIX_METHOD_ID,
  steps: [5],
  tier: "recommended",
  nameKey: "methods.weightedDecisionMatrix.name",
  useWhenKey: "methods.weightedDecisionMatrix.useWhen",
  schema: WeightedDecisionMatrixPayloadSchema,
  Editor: WeightedDecisionMatrixEditor,
  createEmptyPayload: () => ({ criteria: [], options: [] }),
  renderToA3: renderWeightedDecisionMatrixToA3,
};
