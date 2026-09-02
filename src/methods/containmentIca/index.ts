import type { MethodPlugin } from "../types";
import { ContainmentIcaEditor } from "./Editor";
import { renderContainmentIcaToA3 } from "./renderToA3";
import { ContainmentIcaPayloadSchema, type ContainmentIcaPayload } from "./schema";

export const CONTAINMENT_ICA_METHOD_ID = "containment-ica";

export const containmentIcaMethod: MethodPlugin<ContainmentIcaPayload> = {
  id: CONTAINMENT_ICA_METHOD_ID,
  steps: [1],
  nameKey: "methods.containmentIca.name",
  useWhenKey: "methods.containmentIca.useWhen",
  schema: ContainmentIcaPayloadSchema,
  Editor: ContainmentIcaEditor,
  createEmptyPayload: () => ({ rows: [] }),
  renderToA3: renderContainmentIcaToA3,
  aiProposal: { promptVersion: "v1" },
};
