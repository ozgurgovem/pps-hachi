import type { RowTableColumn } from "../shared/rowTable";
import type { StatusTone } from "../shared/statusGlyph";

/** SPEC.md §1.3 (Step 8): "Open items / next problem." */
export type OpenItemsNextProblemColumnKey = "description" | "owner" | "targetDate" | "status";

export const OPEN_ITEMS_NEXT_PROBLEM_STATUS_OPTIONS = [
  { value: "open", labelKey: "methods.openItemsNextProblem.statuses.open" },
  { value: "closed", labelKey: "methods.openItemsNextProblem.statuses.closed" },
] as const;

/** P-37: D-41's shape-coded status marker, applied per row — two shapes, since this vocabulary is genuinely two-valued. */
export const OPEN_ITEMS_NEXT_PROBLEM_STATUS_TONE: Readonly<Record<string, StatusTone>> = {
  closed: "positive",
  open: "negative",
};

export const OPEN_ITEMS_NEXT_PROBLEM_COLUMNS = [
  { key: "description", labelKey: "methods.openItemsNextProblem.columns.description", type: "textarea" },
  { key: "owner", labelKey: "methods.openItemsNextProblem.columns.owner", type: "text" },
  { key: "targetDate", labelKey: "methods.openItemsNextProblem.columns.targetDate", type: "date" },
  {
    key: "status",
    labelKey: "methods.openItemsNextProblem.columns.status",
    type: "select",
    options: OPEN_ITEMS_NEXT_PROBLEM_STATUS_OPTIONS,
  },
] as const satisfies readonly RowTableColumn<OpenItemsNextProblemColumnKey>[];
