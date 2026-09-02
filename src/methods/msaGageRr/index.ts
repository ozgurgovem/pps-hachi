import type { MethodPlugin } from "../types";
import { MsaGageRrEditor } from "./Editor";
import { renderMsaGageRrToA3 } from "./renderToA3";
import { MsaGageRrPayloadSchema, type MsaGageRrPayload } from "./schema";

export const MSA_GAGE_RR_METHOD_ID = "msa-gage-rr";

export const msaGageRrMethod: MethodPlugin<MsaGageRrPayload> = {
  id: MSA_GAGE_RR_METHOD_ID,
  steps: [2],
  nameKey: "methods.msaGageRr.name",
  useWhenKey: "methods.msaGageRr.useWhen",
  schema: MsaGageRrPayloadSchema,
  Editor: MsaGageRrEditor,
  createEmptyPayload: () => ({ method: "", evaluator: "", date: "", percentGrr: "", verdict: "inconclusive", note: "" }),
  renderToA3: renderMsaGageRrToA3,
  aiProposal: { promptVersion: "v1" },
};
