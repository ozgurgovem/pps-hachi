import type { MethodPlugin } from "../types";
import { StratificationMatrixEditor } from "./Editor";
import { renderStratificationMatrixToA3 } from "./renderToA3";
import { StratificationMatrixPayloadSchema, type StratificationMatrixPayload } from "./schema";

export const STRATIFICATION_MATRIX_METHOD_ID = "stratification-matrix";

export const stratificationMatrixMethod: MethodPlugin<StratificationMatrixPayload> = {
  id: STRATIFICATION_MATRIX_METHOD_ID,
  steps: [2],
  tier: "recommended",
  nameKey: "methods.stratificationMatrix.name",
  useWhenKey: "methods.stratificationMatrix.useWhen",
  schema: StratificationMatrixPayloadSchema,
  Editor: StratificationMatrixEditor,
  createEmptyPayload: () => ({ rows: [] }),
  renderToA3: renderStratificationMatrixToA3,
};
