import type { A3BlockContent, A3EntrySummary } from "../../a3/methodContract";
import { rowTableLines } from "../shared/rowTable";
import { TRIAL_RESULT_LOG_COLUMNS } from "./columns";
import type { TrialResultLogPayload } from "./schema";

export function renderTrialResultLogToA3(payload: TrialResultLogPayload, entry: A3EntrySummary): A3BlockContent {
  return {
    lines: [{ text: entry.title, bold: true }, ...rowTableLines(payload.rows, TRIAL_RESULT_LOG_COLUMNS)],
  };
}
