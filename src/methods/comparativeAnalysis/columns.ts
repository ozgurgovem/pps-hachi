import type { RowTableColumn } from "../shared/rowTable";

/**
 * SPEC.md §1.3 (Step 4): "Comparative analysis (good part vs bad part / good
 * line vs bad line)". One row per characteristic compared; `difference` is
 * where the engineer records what the gap actually is, which is the column
 * the method exists for — a table of two values with no stated difference is
 * data, not analysis.
 */
export type ComparativeAnalysisColumnKey = "characteristic" | "goodCase" | "badCase" | "difference";

export const COMPARATIVE_ANALYSIS_COLUMNS = [
  { key: "characteristic", labelKey: "methods.comparativeAnalysis.columns.characteristic", type: "text" },
  { key: "goodCase", labelKey: "methods.comparativeAnalysis.columns.goodCase", type: "text" },
  { key: "badCase", labelKey: "methods.comparativeAnalysis.columns.badCase", type: "text" },
  { key: "difference", labelKey: "methods.comparativeAnalysis.columns.difference", type: "textarea" },
] as const satisfies readonly RowTableColumn<ComparativeAnalysisColumnKey>[];
