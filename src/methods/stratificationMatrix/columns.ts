import type { RowTableColumn } from "../shared/rowTable";

/**
 * SPEC.md §1.3 (Step 2): stratification matrix — by line / shift / machine /
 * cavity / operator / supplier / date / product. `count` isn't named in
 * SPEC.md but is added here: a stratification matrix without an occurrence
 * count per stratum can't show which stratum accounts for most of the
 * problem, which is the entire point of the tool (bundled with 6a's other
 * implementation-level decisions, DECISIONS.md).
 */
export type StratificationMatrixColumnKey =
  | "line"
  | "shift"
  | "machine"
  | "cavity"
  | "operator"
  | "supplier"
  | "date"
  | "product"
  | "count";

export const STRATIFICATION_MATRIX_COLUMNS = [
  { key: "line", labelKey: "methods.stratificationMatrix.columns.line", type: "text" },
  { key: "shift", labelKey: "methods.stratificationMatrix.columns.shift", type: "text" },
  { key: "machine", labelKey: "methods.stratificationMatrix.columns.machine", type: "text" },
  { key: "cavity", labelKey: "methods.stratificationMatrix.columns.cavity", type: "text" },
  { key: "operator", labelKey: "methods.stratificationMatrix.columns.operator", type: "text" },
  { key: "supplier", labelKey: "methods.stratificationMatrix.columns.supplier", type: "text" },
  { key: "date", labelKey: "methods.stratificationMatrix.columns.date", type: "date" },
  { key: "product", labelKey: "methods.stratificationMatrix.columns.product", type: "text" },
  { key: "count", labelKey: "methods.stratificationMatrix.columns.count", type: "text" },
] as const satisfies readonly RowTableColumn<StratificationMatrixColumnKey>[];
