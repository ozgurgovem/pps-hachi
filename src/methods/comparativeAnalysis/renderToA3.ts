import type { A3BlockContent, A3EntrySummary, A3Language, A3TextLine } from "../../a3/methodContract";
import { resolveA3Language } from "../../a3/methodContract";
import { rowTableLines } from "../shared/rowTable";
import { COMPARATIVE_ANALYSIS_COLUMNS } from "./columns";
import type { ComparativeAnalysisPayload } from "./schema";

/** D-188/P-26: abbreviated the same way the existing "Compared" export prefix is. */
const COMPARED_PREFIX: Readonly<Record<A3Language, string>> = { tr: "Karşılaştırılan", en: "Compared" };

export function renderComparativeAnalysisToA3(
  payload: ComparativeAnalysisPayload,
  entry: A3EntrySummary,
): A3BlockContent {
  const language = resolveA3Language(entry);
  const subjectLine: A3TextLine[] =
    payload.subject.trim().length > 0 ? [{ text: `${COMPARED_PREFIX[language]}: ${payload.subject.trim()}` }] : [];

  return {
    lines: [
      { text: entry.title, bold: true },
      ...subjectLine,
      ...rowTableLines(payload.rows, COMPARATIVE_ANALYSIS_COLUMNS),
    ],
  };
}
