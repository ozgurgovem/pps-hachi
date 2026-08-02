import type { Entry } from "../../domain/model";
import type { CellData, MergedRange } from "../descriptor";
import type { A3EntryRendererMap } from "../methodContract";
import type { TemplateBlock } from "../templates/types";
import { estimateCharsPerLine, wrapText } from "./measure";

export interface PlacedBlockContent {
  readonly cells: readonly CellData[];
  readonly merges: readonly MergedRange[];
  readonly placedEntryIds: readonly string[];
  /** Whole entries that did not fit — SPEC.md §2.3: overflow moves whole entries, never splits one. */
  readonly droppedEntryIds: readonly string[];
}

/** Must match the `entryContent`/`entryContentBold` style font size in templates/*.ts (D-40). */
const ENTRY_CONTENT_FONT_PT = 19;
const ENTRY_TITLE_STYLE_ID = "entryContentBold";
const ENTRY_BODY_STYLE_ID = "entryContent";

interface WrappedLine {
  readonly text: string;
  readonly bold: boolean | undefined;
}

/**
 * Places `entries` (already filtered to `primary` visibility and ordered)
 * into a block's content rows, one wrapped text line per row. An entry is
 * placed only if every one of its lines fits in the remaining budget —
 * never split across primary/appendix.
 */
export function placeBlockContent(
  entries: readonly Entry[],
  block: TemplateBlock,
  blockWidthPt: number,
  rendererMap: A3EntryRendererMap,
): PlacedBlockContent {
  const cells: CellData[] = [];
  const merges: MergedRange[] = [];
  const placedEntryIds: string[] = [];
  const droppedEntryIds: string[] = [];

  const maxCharsPerLine = estimateCharsPerLine(blockWidthPt, ENTRY_CONTENT_FONT_PT);
  const lastRow = block.contentRows.end;
  let row = block.contentRows.start;

  for (const entry of entries) {
    const renderer = rendererMap[entry.methodId];
    const content = renderer
      ? renderer(entry.payload, { id: entry.id, title: entry.title })
      : { lines: [{ text: entry.title, bold: true }] };

    const wrappedLines: WrappedLine[] = [];
    for (const line of content.lines) {
      for (const text of wrapText(line.text, maxCharsPerLine)) {
        wrappedLines.push({ text, bold: line.bold });
      }
    }

    if (row + wrappedLines.length - 1 > lastRow) {
      droppedEntryIds.push(entry.id);
      continue;
    }

    for (const line of wrappedLines) {
      const ref = `${block.contentColumns.first}${row}`;
      cells.push({
        ref,
        value: line.text,
        styleId: line.bold ? ENTRY_TITLE_STYLE_ID : ENTRY_BODY_STYLE_ID,
      });
      if (block.contentColumns.first !== block.contentColumns.last) {
        merges.push({ range: `${ref}:${block.contentColumns.last}${row}` });
      }
      row += 1;
    }
    placedEntryIds.push(entry.id);
  }

  return { cells, merges, placedEntryIds, droppedEntryIds };
}
