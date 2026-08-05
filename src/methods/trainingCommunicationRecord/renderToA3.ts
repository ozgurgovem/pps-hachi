import type { A3BlockContent, A3EntrySummary } from "../../a3/methodContract";
import { rowTableLines } from "../shared/rowTable";
import { TRAINING_COMMUNICATION_RECORD_COLUMNS } from "./columns";
import type { TrainingCommunicationRecordPayload } from "./schema";

export function renderTrainingCommunicationRecordToA3(
  payload: TrainingCommunicationRecordPayload,
  entry: A3EntrySummary,
): A3BlockContent {
  return {
    lines: [{ text: entry.title, bold: true }, ...rowTableLines(payload.rows, TRAINING_COMMUNICATION_RECORD_COLUMNS)],
  };
}
