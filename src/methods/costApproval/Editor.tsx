import { FieldFormEditor } from "../shared/FieldFormEditor";
import type { MethodEditorProps } from "../types";
import { COST_APPROVAL_FIELDS, type CostApprovalFieldKey } from "./fields";
import type { CostApprovalPayload } from "./schema";

export function CostApprovalEditor({ payload, onChange }: MethodEditorProps<CostApprovalPayload>) {
  return (
    <FieldFormEditor<CostApprovalFieldKey>
      idPrefix="cost-approval"
      fields={COST_APPROVAL_FIELDS}
      values={payload}
      onChange={(values) => onChange({ ...payload, ...values })}
    />
  );
}
