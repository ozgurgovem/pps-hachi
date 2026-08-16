import type { A3BlockContent, A3EntrySummary, A3TextLine } from "../../a3/methodContract";
import { statusGlyphText } from "../shared/statusGlyph";
import { IMPLEMENTATION_ISSUES_LOG_COLUMNS, IMPLEMENTATION_ISSUES_LOG_STATUS_TONE } from "./columns";
import type { ImplementationIssuesLogPayload, ImplementationIssuesLogRow } from "./schema";

/**
 * Not `rowTableLines`: P-37's status glyph goes per row (D-179's own
 * mockup), so each row needs its own tone — the default formatter has
 * nowhere to hang that.
 */
function rowLine(row: ImplementationIssuesLogRow): A3TextLine | undefined {
  const text = IMPLEMENTATION_ISSUES_LOG_COLUMNS.map((column) => row[column.key].trim())
    .filter((value) => value.length > 0)
    .join(" · ");

  if (text.length === 0) {
    return undefined;
  }

  const tone = IMPLEMENTATION_ISSUES_LOG_STATUS_TONE[row.status.trim()];
  return tone ? { text: statusGlyphText(text, tone), tone } : { text };
}

export function renderImplementationIssuesLogToA3(
  payload: ImplementationIssuesLogPayload,
  entry: A3EntrySummary,
): A3BlockContent {
  const lines = payload.rows.map(rowLine).filter((line): line is A3TextLine => line !== undefined);

  return {
    lines: [{ text: entry.title, bold: true }, ...lines],
  };
}
