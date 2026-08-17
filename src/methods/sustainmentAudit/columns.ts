import type { RowTableColumn } from "../shared/rowTable";

/**
 * TEMPLATE_ANALYSIS.md §13.1 "Effectiveness Check" — Sustainment Audits: a
 * periodic/recurring audit record, distinct from `checkSheet`'s one-off
 * tally. D-115's row-table substrate — each row is one audit event.
 */
export type SustainmentAuditColumnKey =
  | "auditDate"
  | "areaLine"
  | "standardChecked"
  | "sampleSize"
  | "conforming"
  | "nonconforming"
  | "compliancePercent"
  | "auditor"
  | "finding"
  | "reactionActionId"
  | "nextAudit"
  | "status";

export const SUSTAINMENT_AUDIT_STATUS_OPTIONS = [
  { value: "planned", labelKey: "methods.sustainmentAudit.statuses.planned" },
  { value: "verified", labelKey: "methods.sustainmentAudit.statuses.verified" },
  { value: "rejected", labelKey: "methods.sustainmentAudit.statuses.rejected" },
] as const;

export const SUSTAINMENT_AUDIT_COLUMNS = [
  { key: "auditDate", labelKey: "methods.sustainmentAudit.columns.auditDate", type: "date" },
  { key: "areaLine", labelKey: "methods.sustainmentAudit.columns.areaLine", type: "text" },
  { key: "standardChecked", labelKey: "methods.sustainmentAudit.columns.standardChecked", type: "text" },
  // D-120: numeric-shaped fields (sample size, conforming/nonconforming counts, compliance %)
  // stay string-typed, matching every other row-table column — recorded, never computed on.
  { key: "sampleSize", labelKey: "methods.sustainmentAudit.columns.sampleSize", type: "text" },
  { key: "conforming", labelKey: "methods.sustainmentAudit.columns.conforming", type: "text" },
  { key: "nonconforming", labelKey: "methods.sustainmentAudit.columns.nonconforming", type: "text" },
  { key: "compliancePercent", labelKey: "methods.sustainmentAudit.columns.compliancePercent", type: "text" },
  { key: "auditor", labelKey: "methods.sustainmentAudit.columns.auditor", type: "text" },
  { key: "finding", labelKey: "methods.sustainmentAudit.columns.finding", type: "textarea" },
  // C4 §2.2 (AskUserQuestion): no reference role this round — Doc ID/Reaction
  // action ID targets are typed by hand, same posture as every other field.
  { key: "reactionActionId", labelKey: "methods.sustainmentAudit.columns.reactionActionId", type: "text" },
  { key: "nextAudit", labelKey: "methods.sustainmentAudit.columns.nextAudit", type: "date" },
  {
    key: "status",
    labelKey: "methods.sustainmentAudit.columns.status",
    type: "select",
    options: SUSTAINMENT_AUDIT_STATUS_OPTIONS,
  },
] as const satisfies readonly RowTableColumn<SustainmentAuditColumnKey>[];
