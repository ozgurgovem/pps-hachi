import type { RowTableColumn } from "../shared/rowTable";

/** SPEC.md §1.3 (Step 6): "Training & communication record." */
export type TrainingCommunicationRecordColumnKey = "date" | "audience" | "method" | "acknowledgedBy";

export const TRAINING_COMMUNICATION_RECORD_COLUMNS = [
  { key: "date", labelKey: "methods.trainingCommunicationRecord.columns.date", type: "date" },
  { key: "audience", labelKey: "methods.trainingCommunicationRecord.columns.audience", type: "text" },
  { key: "method", labelKey: "methods.trainingCommunicationRecord.columns.method", type: "text" },
  {
    key: "acknowledgedBy",
    labelKey: "methods.trainingCommunicationRecord.columns.acknowledgedBy",
    type: "text",
  },
] as const satisfies readonly RowTableColumn<TrainingCommunicationRecordColumnKey>[];
