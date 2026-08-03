import type { RowTableColumn } from "../shared/rowTable";

/** SPEC.md §1.3 (Step 2): process flow / SIPOC — one row per process step. */
export type ProcessFlowSipocColumnKey = "step" | "supplier" | "input" | "process" | "output" | "customer";

export const PROCESS_FLOW_SIPOC_COLUMNS = [
  { key: "step", labelKey: "methods.processFlowSipoc.columns.step", type: "text" },
  { key: "supplier", labelKey: "methods.processFlowSipoc.columns.supplier", type: "text" },
  { key: "input", labelKey: "methods.processFlowSipoc.columns.input", type: "text" },
  { key: "process", labelKey: "methods.processFlowSipoc.columns.process", type: "text" },
  { key: "output", labelKey: "methods.processFlowSipoc.columns.output", type: "text" },
  { key: "customer", labelKey: "methods.processFlowSipoc.columns.customer", type: "text" },
] as const satisfies readonly RowTableColumn<ProcessFlowSipocColumnKey>[];
