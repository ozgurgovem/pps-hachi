import type { MethodPlugin } from "../types";
import { ImpactEffortMatrixEditor } from "./Editor";
import { renderImpactEffortMatrixToA3 } from "./renderToA3";
import { ImpactEffortMatrixPayloadSchema, type ImpactEffortMatrixPayload } from "./schema";

export const IMPACT_EFFORT_MATRIX_METHOD_ID = "impact-effort-matrix";

export const impactEffortMatrixMethod: MethodPlugin<ImpactEffortMatrixPayload> = {
  id: IMPACT_EFFORT_MATRIX_METHOD_ID,
  steps: [5],
  nameKey: "methods.impactEffortMatrix.name",
  useWhenKey: "methods.impactEffortMatrix.useWhen",
  schema: ImpactEffortMatrixPayloadSchema,
  Editor: ImpactEffortMatrixEditor,
  createEmptyPayload: () => ({ items: [] }),
  renderToA3: renderImpactEffortMatrixToA3,
};
