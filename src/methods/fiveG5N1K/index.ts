import type { MethodPlugin } from "../types";
import { FiveG5N1KEditor } from "./Editor";
import { renderFiveG5N1KToA3 } from "./renderToA3";
import { FiveG5N1KPayloadSchema, type FiveG5N1KPayload } from "./schema";

export const FIVE_G_5N1K_METHOD_ID = "five-g-5n1k";

export const fiveG5N1KMethod: MethodPlugin<FiveG5N1KPayload> = {
  id: FIVE_G_5N1K_METHOD_ID,
  steps: [1],
  nameKey: "methods.fiveG5N1K.name",
  useWhenKey: "methods.fiveG5N1K.useWhen",
  schema: FiveG5N1KPayloadSchema,
  Editor: FiveG5N1KEditor,
  createEmptyPayload: () => ({
    gemba: "",
    gembutsu: "",
    genjitsu: "",
    genri: "",
    gensoku: "",
    ne: "",
    nerede: "",
    nasil: "",
    neZaman: "",
    neKadar: "",
    kim: "",
  }),
  renderToA3: renderFiveG5N1KToA3,
  aiProposal: { promptVersion: "v1" },
};
