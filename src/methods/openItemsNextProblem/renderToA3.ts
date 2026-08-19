import type { A3BlockContent, A3EntrySummary, A3TextLine } from "../../a3/methodContract";
import { statusGlyphText } from "../shared/statusGlyph";
import { OPEN_ITEMS_NEXT_PROBLEM_COLUMNS, OPEN_ITEMS_NEXT_PROBLEM_STATUS_TONE } from "./columns";
import type { OpenItemsNextProblemPayload, OpenItemsNextProblemRow } from "./schema";

/** Not `rowTableLines`: P-37's status glyph goes per row, so each row needs its own tone. */
function rowLine(row: OpenItemsNextProblemRow): A3TextLine | undefined {
  const text = OPEN_ITEMS_NEXT_PROBLEM_COLUMNS.map((column) => row[column.key].trim())
    .filter((value) => value.length > 0)
    .join(" · ");

  if (text.length === 0) {
    return undefined;
  }

  const tone = OPEN_ITEMS_NEXT_PROBLEM_STATUS_TONE[row.status.trim()];
  return tone ? { text: statusGlyphText(text, tone), tone } : { text };
}

export function renderOpenItemsNextProblemToA3(
  payload: OpenItemsNextProblemPayload,
  entry: A3EntrySummary,
): A3BlockContent {
  const lines = payload.rows.map(rowLine).filter((line): line is A3TextLine => line !== undefined);

  return {
    lines: [{ text: entry.title, bold: true }, ...lines],
  };
}
