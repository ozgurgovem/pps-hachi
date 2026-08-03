import type { MethodPlugin } from "../types";
import { ProblemTypeClassifierEditor } from "./Editor";
import { renderProblemTypeClassifierToA3 } from "./renderToA3";
import { ProblemTypeClassifierPayloadSchema, type ProblemTypeClassifierPayload } from "./schema";

export const PROBLEM_TYPE_CLASSIFIER_METHOD_ID = "problem-type-classifier";

export const problemTypeClassifierMethod: MethodPlugin<ProblemTypeClassifierPayload> = {
  id: PROBLEM_TYPE_CLASSIFIER_METHOD_ID,
  steps: [1],
  nameKey: "methods.problemTypeClassifier.name",
  useWhenKey: "methods.problemTypeClassifier.useWhen",
  schema: ProblemTypeClassifierPayloadSchema,
  Editor: ProblemTypeClassifierEditor,
  createEmptyPayload: () => ({ classification: "belowStandard", note: "" }),
  renderToA3: renderProblemTypeClassifierToA3,
};
