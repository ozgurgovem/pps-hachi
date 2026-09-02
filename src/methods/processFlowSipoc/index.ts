import type { MethodPlugin } from "../types";
import { ProcessFlowSipocEditor } from "./Editor";
import { renderProcessFlowSipocToA3 } from "./renderToA3";
import { ProcessFlowSipocPayloadSchema, type ProcessFlowSipocPayload } from "./schema";

export const PROCESS_FLOW_SIPOC_METHOD_ID = "process-flow-sipoc";

export const processFlowSipocMethod: MethodPlugin<ProcessFlowSipocPayload> = {
  id: PROCESS_FLOW_SIPOC_METHOD_ID,
  steps: [2],
  nameKey: "methods.processFlowSipoc.name",
  useWhenKey: "methods.processFlowSipoc.useWhen",
  schema: ProcessFlowSipocPayloadSchema,
  Editor: ProcessFlowSipocEditor,
  createEmptyPayload: () => ({ rows: [] }),
  renderToA3: renderProcessFlowSipocToA3,
  aiProposal: { promptVersion: "v1" },
};
