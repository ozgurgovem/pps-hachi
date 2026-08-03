import type { A3BlockContent, A3EntrySummary } from "../../a3/methodContract";
import { rowTableLines } from "../shared/rowTable";
import { VOC_COMPLAINT_COLUMNS } from "./columns";
import type { VocComplaintPayload } from "./schema";

export function renderVocComplaintToA3(payload: VocComplaintPayload, entry: A3EntrySummary): A3BlockContent {
  return {
    lines: [{ text: entry.title, bold: true }, ...rowTableLines(payload.rows, VOC_COMPLAINT_COLUMNS)],
  };
}
