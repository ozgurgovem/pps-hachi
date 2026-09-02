import type { MethodPlugin } from "../types";
import { VocComplaintEditor } from "./Editor";
import { renderVocComplaintToA3 } from "./renderToA3";
import { VocComplaintPayloadSchema, type VocComplaintPayload } from "./schema";

export const VOC_COMPLAINT_METHOD_ID = "voc-complaint-record";

export const vocComplaintMethod: MethodPlugin<VocComplaintPayload> = {
  id: VOC_COMPLAINT_METHOD_ID,
  steps: [1],
  nameKey: "methods.vocComplaint.name",
  useWhenKey: "methods.vocComplaint.useWhen",
  schema: VocComplaintPayloadSchema,
  Editor: VocComplaintEditor,
  createEmptyPayload: () => ({ rows: [] }),
  renderToA3: renderVocComplaintToA3,
  aiProposal: { promptVersion: "v1" },
};
