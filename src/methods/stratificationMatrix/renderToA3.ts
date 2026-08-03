import type { A3BlockContent, A3EntrySummary } from "../../a3/methodContract";
import { rowTableLines } from "../shared/rowTable";
import { STRATIFICATION_MATRIX_COLUMNS } from "./columns";
import type { StratificationMatrixPayload } from "./schema";

export function renderStratificationMatrixToA3(
  payload: StratificationMatrixPayload,
  entry: A3EntrySummary,
): A3BlockContent {
  return {
    lines: [{ text: entry.title, bold: true }, ...rowTableLines(payload.rows, STRATIFICATION_MATRIX_COLUMNS)],
  };
}
