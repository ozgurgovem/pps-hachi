import type { RowTableColumn } from "../shared/rowTable";

/** SPEC.md §1.3 (Step 1): Voice of Customer / complaint record. */
export type VocComplaintColumnKey = "customer" | "claimNo" | "partNo" | "ppm" | "date";

export const VOC_COMPLAINT_COLUMNS = [
  { key: "customer", labelKey: "methods.vocComplaint.columns.customer", type: "text" },
  { key: "claimNo", labelKey: "methods.vocComplaint.columns.claimNo", type: "text" },
  { key: "partNo", labelKey: "methods.vocComplaint.columns.partNo", type: "text" },
  { key: "ppm", labelKey: "methods.vocComplaint.columns.ppm", type: "text" },
  { key: "date", labelKey: "methods.vocComplaint.columns.date", type: "date" },
] as const satisfies readonly RowTableColumn<VocComplaintColumnKey>[];
