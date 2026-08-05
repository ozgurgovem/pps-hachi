import { emptyFieldFormValues } from "../shared/fieldForm";
import type { MethodPlugin } from "../types";
import { CostApprovalEditor } from "./Editor";
import { COST_APPROVAL_FIELDS } from "./fields";
import { renderCostApprovalToA3 } from "./renderToA3";
import { CostApprovalPayloadSchema, type CostApprovalPayload } from "./schema";

export const COST_APPROVAL_METHOD_ID = "cost-approval";

export const costApprovalMethod: MethodPlugin<CostApprovalPayload> = {
  id: COST_APPROVAL_METHOD_ID,
  steps: [5],
  nameKey: "methods.costApproval.name",
  useWhenKey: "methods.costApproval.useWhen",
  schema: CostApprovalPayloadSchema,
  Editor: CostApprovalEditor,
  createEmptyPayload: () => emptyFieldFormValues(COST_APPROVAL_FIELDS),
  renderToA3: renderCostApprovalToA3,
};
