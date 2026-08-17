import type { A3BlockContent, A3EntrySummary } from "../../a3/methodContract";
import { rowTableLines } from "../shared/rowTable";
import { YOKOTEN_TRACKER_COLUMNS } from "./columns";
import type { YokotenTrackerPayload } from "./schema";

export function renderYokotenTrackerToA3(payload: YokotenTrackerPayload, entry: A3EntrySummary): A3BlockContent {
  return {
    lines: [{ text: entry.title, bold: true }, ...rowTableLines(payload.rows, YOKOTEN_TRACKER_COLUMNS)],
  };
}
