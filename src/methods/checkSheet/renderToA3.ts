import type { A3BlockContent, A3EntrySummary } from "../../a3/methodContract";
import { rowTableLines } from "../shared/rowTable";
import { CHECK_SHEET_COLUMNS } from "./columns";
import type { CheckSheetPayload } from "./schema";

export function renderCheckSheetToA3(payload: CheckSheetPayload, entry: A3EntrySummary): A3BlockContent {
  return {
    lines: [{ text: entry.title, bold: true }, ...rowTableLines(payload.rows, CHECK_SHEET_COLUMNS)],
  };
}
