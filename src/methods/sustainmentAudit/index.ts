import type { MethodPlugin } from "../types";
import { SustainmentAuditEditor } from "./Editor";
import { renderSustainmentAuditToA3 } from "./renderToA3";
import { SustainmentAuditPayloadSchema, type SustainmentAuditPayload } from "./schema";

export const SUSTAINMENT_AUDIT_METHOD_ID = "sustainment-audit";

export const sustainmentAuditMethod: MethodPlugin<SustainmentAuditPayload> = {
  id: SUSTAINMENT_AUDIT_METHOD_ID,
  steps: [7],
  nameKey: "methods.sustainmentAudit.name",
  useWhenKey: "methods.sustainmentAudit.useWhen",
  schema: SustainmentAuditPayloadSchema,
  Editor: SustainmentAuditEditor,
  createEmptyPayload: () => ({ rows: [] }),
  renderToA3: renderSustainmentAuditToA3,
};
