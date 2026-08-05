import type { A3BlockContent, A3EntrySummary } from "../../a3/methodContract";
import { rowTableLines } from "../shared/rowTable";
import { IMPLEMENTATION_ISSUES_LOG_COLUMNS } from "./columns";
import type { ImplementationIssuesLogPayload } from "./schema";

export function renderImplementationIssuesLogToA3(
  payload: ImplementationIssuesLogPayload,
  entry: A3EntrySummary,
): A3BlockContent {
  return {
    lines: [{ text: entry.title, bold: true }, ...rowTableLines(payload.rows, IMPLEMENTATION_ISSUES_LOG_COLUMNS)],
  };
}
