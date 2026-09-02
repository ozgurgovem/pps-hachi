import type { MethodPlugin } from "../types";
import { FiveN1KEditor } from "./Editor";
import { renderFiveN1KToA3 } from "./renderToA3";
import { FiveN1KPayloadSchema, type FiveN1KPayload } from "./schema";

export const FIVE_N1K_METHOD_ID = "five-n1k";

export const fiveN1KMethod: MethodPlugin<FiveN1KPayload> = {
  id: FIVE_N1K_METHOD_ID,
  steps: [1],
  tier: "recommended",
  nameKey: "methods.fiveN1K.name",
  useWhenKey: "methods.fiveN1K.useWhen",
  schema: FiveN1KPayloadSchema,
  Editor: FiveN1KEditor,
  createEmptyPayload: () => ({
    ne: "",
    neden: "",
    nasil: "",
    kim: "",
    neZaman: "",
    nerede: "",
  }),
  renderToA3: renderFiveN1KToA3,
  aiProposal: { promptVersion: "v1" },
};
