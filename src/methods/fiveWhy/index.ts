import type { MethodPlugin } from "../types";
import { FiveWhyEditor } from "./Editor";
import { renderFiveWhyToA3 } from "./renderToA3";
import { FiveWhyPayloadSchema, type FiveWhyPayload } from "./schema";

export const FIVE_WHY_METHOD_ID = "five-why";

export const fiveWhyMethod: MethodPlugin<FiveWhyPayload> = {
  id: FIVE_WHY_METHOD_ID,
  // D-11: Step 4 only.
  steps: [4],
  tier: "recommended",
  nameKey: "methods.fiveWhy.name",
  useWhenKey: "methods.fiveWhy.useWhen",
  schema: FiveWhyPayloadSchema,
  Editor: FiveWhyEditor,
  createEmptyPayload: () => ({ problemStatement: "", whys: [] }),
  renderToA3: renderFiveWhyToA3,
  aiProposal: { promptVersion: "v1" },
};
