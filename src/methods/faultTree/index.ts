import type { MethodPlugin } from "../types";
import { FaultTreeEditor } from "./Editor";
import { renderFaultTreeToA3 } from "./renderToA3";
import { FaultTreePayloadSchema, type FaultTreePayload } from "./schema";

export const FAULT_TREE_METHOD_ID = "fault-tree";

export const faultTreeMethod: MethodPlugin<FaultTreePayload> = {
  id: FAULT_TREE_METHOD_ID,
  steps: [4],
  nameKey: "methods.faultTree.name",
  useWhenKey: "methods.faultTree.useWhen",
  schema: FaultTreePayloadSchema,
  Editor: FaultTreeEditor,
  createEmptyPayload: () => ({ nodes: [] }),
  renderToA3: renderFaultTreeToA3,
  aiProposal: { promptVersion: "v1" },
};
