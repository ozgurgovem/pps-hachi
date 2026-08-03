import type { RowTableColumn } from "../shared/rowTable";

/** SPEC.md §1.3 (Step 1): Containment / Interim Containment Action (ICA). */
export type ContainmentIcaColumnKey = "action" | "owner" | "startDate" | "effectivenessCheck" | "exitCriteria";

export const CONTAINMENT_ICA_COLUMNS = [
  { key: "action", labelKey: "methods.containmentIca.columns.action", type: "textarea" },
  { key: "owner", labelKey: "methods.containmentIca.columns.owner", type: "text" },
  { key: "startDate", labelKey: "methods.containmentIca.columns.startDate", type: "date" },
  { key: "effectivenessCheck", labelKey: "methods.containmentIca.columns.effectivenessCheck", type: "textarea" },
  { key: "exitCriteria", labelKey: "methods.containmentIca.columns.exitCriteria", type: "textarea" },
] as const satisfies readonly RowTableColumn<ContainmentIcaColumnKey>[];
