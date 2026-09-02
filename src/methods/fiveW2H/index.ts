import type { MethodPlugin } from "../types";
import { FiveW2HEditor } from "./Editor";
import { renderFiveW2HToA3 } from "./renderToA3";
import { FiveW2HPayloadSchema, type FiveW2HPayload } from "./schema";

export const FIVE_W2H_METHOD_ID = "five-w2h";

export const fiveW2HMethod: MethodPlugin<FiveW2HPayload> = {
  id: FIVE_W2H_METHOD_ID,
  steps: [1],
  tier: "recommended",
  nameKey: "methods.fiveW2H.name",
  useWhenKey: "methods.fiveW2H.useWhen",
  schema: FiveW2HPayloadSchema,
  Editor: FiveW2HEditor,
  createEmptyPayload: () => ({ what: "", where: "", when: "", who: "", which: "", how: "", howMuch: "" }),
  renderToA3: renderFiveW2HToA3,
  aiProposal: { promptVersion: "v1" },
};
