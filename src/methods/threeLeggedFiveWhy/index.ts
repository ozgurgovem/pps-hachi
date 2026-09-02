import type { MethodPlugin } from "../types";
import { ThreeLeggedFiveWhyEditor } from "./Editor";
import { renderThreeLeggedFiveWhyToA3 } from "./renderToA3";
import { ThreeLeggedFiveWhyPayloadSchema, type ThreeLeggedFiveWhyPayload } from "./schema";

export const THREE_LEGGED_FIVE_WHY_METHOD_ID = "three-legged-five-why";

export const threeLeggedFiveWhyMethod: MethodPlugin<ThreeLeggedFiveWhyPayload> = {
  id: THREE_LEGGED_FIVE_WHY_METHOD_ID,
  // D-11: Step 4 only.
  steps: [4],
  nameKey: "methods.threeLeggedFiveWhy.name",
  useWhenKey: "methods.threeLeggedFiveWhy.useWhen",
  schema: ThreeLeggedFiveWhyPayloadSchema,
  Editor: ThreeLeggedFiveWhyEditor,
  createEmptyPayload: () => ({ problemStatement: "", occurrence: [], detection: [], systemic: [] }),
  renderToA3: renderThreeLeggedFiveWhyToA3,
  aiProposal: { promptVersion: "v1" },
};
