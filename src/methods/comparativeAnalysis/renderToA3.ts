import type { A3BlockContent, A3EntrySummary, A3TextLine } from "../../a3/methodContract";
import { rowTableLines } from "../shared/rowTable";
import { COMPARATIVE_ANALYSIS_COLUMNS } from "./columns";
import type { ComparativeAnalysisPayload } from "./schema";

export function renderComparativeAnalysisToA3(
  payload: ComparativeAnalysisPayload,
  entry: A3EntrySummary,
): A3BlockContent {
  const subjectLine: A3TextLine[] =
    payload.subject.trim().length > 0 ? [{ text: `Compared: ${payload.subject.trim()}` }] : [];

  return {
    lines: [
      { text: entry.title, bold: true },
      ...subjectLine,
      ...rowTableLines(payload.rows, COMPARATIVE_ANALYSIS_COLUMNS),
    ],
  };
}
