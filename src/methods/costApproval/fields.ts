import type { FieldFormField } from "../shared/fieldForm";

export type CostApprovalFieldKey = "costEstimate" | "approvalStatus" | "approvedBy" | "approvalDate";

export const COST_APPROVAL_STATUS_OPTIONS = [
  { value: "pending", labelKey: "methods.costApproval.statuses.pending" },
  { value: "approved", labelKey: "methods.costApproval.statuses.approved" },
  { value: "rejected", labelKey: "methods.costApproval.statuses.rejected" },
] as const;

/** A3-side labels — `renderToA3` is i18n-free (D-43). */
export const COST_APPROVAL_STATUS_EXPORT_LABELS: Readonly<Record<string, string>> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

/** SPEC.md §1.3 (Step 5): "Cost & approval fields." */
export const COST_APPROVAL_FIELDS = [
  {
    key: "costEstimate",
    labelKey: "methods.costApproval.fields.costEstimate",
    exportLabel: "Cost estimate",
    type: "text",
  },
  {
    key: "approvalStatus",
    labelKey: "methods.costApproval.fields.approvalStatus",
    exportLabel: "Approval status",
    type: "select",
    options: COST_APPROVAL_STATUS_OPTIONS,
  },
  { key: "approvedBy", labelKey: "methods.costApproval.fields.approvedBy", exportLabel: "Approved by", type: "text" },
  {
    key: "approvalDate",
    labelKey: "methods.costApproval.fields.approvalDate",
    exportLabel: "Approval date",
    type: "date",
  },
] as const satisfies readonly FieldFormField<CostApprovalFieldKey>[];
