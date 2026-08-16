import type { RowTableColumn } from "../shared/rowTable";
import type { StatusTone } from "../shared/statusGlyph";

/** SPEC.md §1.3 (Step 6): "Implementation issues log." */
export type ImplementationIssuesLogColumnKey = "date" | "issue" | "impact" | "resolution" | "status";

export const IMPLEMENTATION_ISSUES_LOG_STATUS_OPTIONS = [
  { value: "open", labelKey: "methods.implementationIssuesLog.statuses.open" },
  { value: "resolved", labelKey: "methods.implementationIssuesLog.statuses.resolved" },
] as const;

/** P-37: D-41's shape-coded status marker, applied per row — only two shapes, since this vocabulary is genuinely two-valued. */
export const IMPLEMENTATION_ISSUES_LOG_STATUS_TONE: Readonly<Record<string, StatusTone>> = {
  resolved: "positive",
  open: "negative",
};

export const IMPLEMENTATION_ISSUES_LOG_COLUMNS = [
  { key: "date", labelKey: "methods.implementationIssuesLog.columns.date", type: "date" },
  { key: "issue", labelKey: "methods.implementationIssuesLog.columns.issue", type: "textarea" },
  { key: "impact", labelKey: "methods.implementationIssuesLog.columns.impact", type: "text" },
  { key: "resolution", labelKey: "methods.implementationIssuesLog.columns.resolution", type: "textarea" },
  {
    key: "status",
    labelKey: "methods.implementationIssuesLog.columns.status",
    type: "select",
    options: IMPLEMENTATION_ISSUES_LOG_STATUS_OPTIONS,
  },
] as const satisfies readonly RowTableColumn<ImplementationIssuesLogColumnKey>[];
