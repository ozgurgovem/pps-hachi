import type { RowTableColumn } from "../shared/rowTable";

/** SPEC.md §1.3 (Step 6): "Trial result log." */
export type TrialResultLogColumnKey = "date" | "result" | "note";

export const TRIAL_RESULT_LOG_COLUMNS = [
  { key: "date", labelKey: "methods.trialResultLog.columns.date", type: "date" },
  { key: "result", labelKey: "methods.trialResultLog.columns.result", type: "textarea" },
  { key: "note", labelKey: "methods.trialResultLog.columns.note", type: "textarea" },
] as const satisfies readonly RowTableColumn<TrialResultLogColumnKey>[];
