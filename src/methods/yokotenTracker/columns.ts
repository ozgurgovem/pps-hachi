import { DOCUMENT_APPROVAL_OPTIONS, DOCUMENT_STATUS_OPTIONS } from "../shared/documentStatusOptions";
import type { RowTableColumn } from "../shared/rowTable";

/**
 * TEMPLATE_ANALYSIS.md §13.1 (Standardization, Yokoten & Lessons Learned
 * page) / §13.4 candidate 3: horizontal-spread (Yokoten) tracking — a
 * variable-length row list, `checkSheet`'s pattern (D-115). `status` and
 * `approval` reuse the shared `Lists & Settings` dictionary
 * (`documentStatusOptions.ts`) — the same vocabulary `documentUpdatesTracker`
 * draws on. The remaining fields are transcribed as plain text/textarea:
 * only `documentUpdatesTracker`'s two fields are explicitly marked
 * "(Yes/No)" in the source (§13.1) — `riskReviewed`/`actionRequired`/
 * `effectivenessChecked` are not, so this stays a literal transcription
 * rather than an invented Yes/No gate.
 */
export type YokotenTrackerColumnKey =
  | "siteLine"
  | "applicability"
  | "riskReviewed"
  | "actionRequired"
  | "owner"
  | "dueDate"
  | "status"
  | "completionEvidence"
  | "effectivenessChecked"
  | "checkDate"
  | "result"
  | "approval"
  | "notes";

export const YOKOTEN_TRACKER_COLUMNS = [
  { key: "siteLine", labelKey: "methods.yokotenTracker.columns.siteLine", type: "text" },
  { key: "applicability", labelKey: "methods.yokotenTracker.columns.applicability", type: "textarea" },
  { key: "riskReviewed", labelKey: "methods.yokotenTracker.columns.riskReviewed", type: "text" },
  { key: "actionRequired", labelKey: "methods.yokotenTracker.columns.actionRequired", type: "text" },
  { key: "owner", labelKey: "methods.yokotenTracker.columns.owner", type: "text" },
  { key: "dueDate", labelKey: "methods.yokotenTracker.columns.dueDate", type: "date" },
  { key: "status", labelKey: "methods.yokotenTracker.columns.status", type: "select", options: DOCUMENT_STATUS_OPTIONS },
  { key: "completionEvidence", labelKey: "methods.yokotenTracker.columns.completionEvidence", type: "text" },
  { key: "effectivenessChecked", labelKey: "methods.yokotenTracker.columns.effectivenessChecked", type: "text" },
  { key: "checkDate", labelKey: "methods.yokotenTracker.columns.checkDate", type: "date" },
  { key: "result", labelKey: "methods.yokotenTracker.columns.result", type: "text" },
  {
    key: "approval",
    labelKey: "methods.yokotenTracker.columns.approval",
    type: "select",
    options: DOCUMENT_APPROVAL_OPTIONS,
  },
  { key: "notes", labelKey: "methods.yokotenTracker.columns.notes", type: "textarea" },
] as const satisfies readonly RowTableColumn<YokotenTrackerColumnKey>[];
