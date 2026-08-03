import type { RowTableColumn } from "../shared/rowTable";

/** SPEC.md §1.3 (Step 2): check sheet / tally sheet. */
export type CheckSheetColumnKey = "item" | "count" | "date" | "note";

export const CHECK_SHEET_COLUMNS = [
  { key: "item", labelKey: "methods.checkSheet.columns.item", type: "text" },
  { key: "count", labelKey: "methods.checkSheet.columns.count", type: "text" },
  { key: "date", labelKey: "methods.checkSheet.columns.date", type: "date" },
  { key: "note", labelKey: "methods.checkSheet.columns.note", type: "textarea" },
] as const satisfies readonly RowTableColumn<CheckSheetColumnKey>[];
