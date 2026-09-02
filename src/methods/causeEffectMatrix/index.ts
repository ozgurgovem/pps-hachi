import type { MethodPlugin } from "../types";
import { CauseEffectMatrixEditor } from "./Editor";
import { renderCauseEffectMatrixToA3 } from "./renderToA3";
import { CauseEffectMatrixPayloadSchema, type CauseEffectMatrixPayload } from "./schema";

export const CAUSE_EFFECT_MATRIX_METHOD_ID = "cause-effect-matrix";

export const causeEffectMatrixMethod: MethodPlugin<CauseEffectMatrixPayload> = {
  id: CAUSE_EFFECT_MATRIX_METHOD_ID,
  steps: [4],
  nameKey: "methods.causeEffectMatrix.name",
  useWhenKey: "methods.causeEffectMatrix.useWhen",
  schema: CauseEffectMatrixPayloadSchema,
  Editor: CauseEffectMatrixEditor,
  createEmptyPayload: () => ({ outputs: [], inputs: [] }),
  renderToA3: renderCauseEffectMatrixToA3,
  aiProposal: { promptVersion: "v1" },
};
