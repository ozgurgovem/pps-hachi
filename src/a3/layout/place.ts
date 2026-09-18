import type { Entry, ProjectModel } from "../../domain/model";
import type { CellData, MergedRange, RowDef } from "../descriptor";
import {
  resolveEntryContent,
  type A3BlockContent,
  type A3EntryRendererMap,
  type A3ImageKind,
  type A3TextTone,
} from "../methodContract";
import type { TemplateBlock } from "../templates/types";
import { ENTRY_CONTENT_FONT_PT, resolveLineStyleId, type ColumnWidth } from "./contentStyle";
import { estimateCharsPerLine, wrapText } from "./measure";
import { placeZonesContent, splitColumnsIntoZones } from "./placeZones";
import { groupIntoRuns } from "./widthFractionGroups";

/**
 * D-102: geometry for a chart/diagram image, discovered in the same pass
 * that places text — never pixels. `buildA3Layout`'s caller rasterizes each
 * slot's `spec` to PNG (impure, off-screen) and feeds the bytes back in as
 * an `ImagePlacement` on a second `buildA3Layout` call. Never crosses the
 * Tauri IPC boundary — only the fully-baked descriptor does.
 */
export interface PendingImageSlot {
  readonly entryId: string;
  readonly kind: A3ImageKind;
  readonly spec: unknown;
  readonly anchorCell: string;
  readonly widthPt: number;
  readonly heightPt: number;
  /** D-118/D-193: carried straight through from `A3ImageRequest` — see its own doc comment. */
  readonly source?: "asset" | undefined;
  readonly assetImageId?: string | undefined;
}

export interface PlacedBlockContent {
  readonly cells: readonly CellData[];
  readonly merges: readonly MergedRange[];
  readonly placedEntryIds: readonly string[];
  /** Whole entries that did not fit — SPEC.md §2.3: overflow moves whole entries, never splits one. */
  readonly droppedEntryIds: readonly string[];
  readonly pendingImages: readonly PendingImageSlot[];
}

interface WrappedLine {
  readonly text: string;
  readonly bold: boolean | undefined;
  readonly tone: A3TextTone | undefined;
  readonly fillStyleId: string | undefined;
}

/** P-22/D-270: exported so `buildA3Layout.ts`'s block-aggregate-image reservation can size its own anchor the same way a per-entry image already does — one height-summing implementation, never two. */
export function heightOfRows(contentRows: readonly RowDef[], startRow: number, rowSpan: number): number {
  const endRow = startRow + rowSpan - 1;
  return contentRows
    .filter((row) => row.index >= startRow && row.index <= endRow)
    .reduce((sum, row) => sum + row.heightPt, 0);
}

interface ColumnRange {
  readonly firstCol: string;
  readonly lastCol: string;
  readonly widthPt: number;
}

interface PlacedEntryContent {
  readonly cells: readonly CellData[];
  readonly merges: readonly MergedRange[];
  readonly pendingImages: readonly PendingImageSlot[];
  /** How many rows, starting at the `startRow` this was placed at, the entry actually consumed. */
  readonly rowsUsed: number;
}

/**
 * Places one entry's `lines`/`image` content (never `zones` — that has its
 * own dedicated `placeZonesContent` path) inside a given column range and
 * row band. Parameterized by `range` rather than always reading
 * `block.contentColumns` so the exact same wrap/anchor/drop logic serves
 * both the Phase 4 default (one entry, the block's full width) and a
 * side-by-side group's own narrower per-entry sub-range (ADIM 1 round,
 * 2026-09-17) — extracted out of `placeBlockContent`'s own former inline
 * loop body, no behaviour change for the full-width case.
 */
function placeEntryContent(
  entry: Entry,
  content: A3BlockContent,
  range: ColumnRange,
  startRow: number,
  lastRow: number,
  contentRows: readonly RowDef[],
): PlacedEntryContent | undefined {
  const maxCharsPerLine = estimateCharsPerLine(range.widthPt, ENTRY_CONTENT_FONT_PT);
  const wrappedLines: WrappedLine[] = [];
  for (const line of content.lines) {
    for (const text of wrapText(line.text, maxCharsPerLine)) {
      wrappedLines.push({ text, bold: line.bold, tone: line.tone, fillStyleId: line.fillStyleId });
    }
  }

  const imageRowSpan = content.image
    ? (content.image.rowSpan ?? lastRow - startRow - wrappedLines.length + 1)
    : 0;
  const totalRowSpan = wrappedLines.length + imageRowSpan;

  // An image needs at least one row of its own. Without the `<= 0` guard a
  // chart whose text exactly filled the band still counted as "placed" and
  // emitted a slot with `heightPt: 0`, anchored one row *past* the band —
  // the rasterizer would then capture a zero-height PNG and the writer
  // would embed it outside its own block. D-100's rule is that a whole
  // entry either fits or moves to an appendix; a chart with nowhere to
  // draw does not fit.
  const imageHasNoRoom = content.image !== undefined && imageRowSpan <= 0;
  if (totalRowSpan === 0 || startRow + totalRowSpan - 1 > lastRow || imageHasNoRoom) {
    return undefined;
  }

  const cells: CellData[] = [];
  const merges: MergedRange[] = [];
  const pendingImages: PendingImageSlot[] = [];
  let row = startRow;

  for (const line of wrappedLines) {
    const ref = `${range.firstCol}${row}`;
    cells.push({
      ref,
      value: line.text,
      styleId: resolveLineStyleId({ bold: line.bold, tone: line.tone, fillStyleId: line.fillStyleId }),
    });
    if (range.firstCol !== range.lastCol) {
      merges.push({ range: `${ref}:${range.lastCol}${row}` });
    }
    row += 1;
  }

  if (content.image) {
    pendingImages.push({
      entryId: entry.id,
      kind: content.image.kind,
      spec: content.image.spec,
      anchorCell: `${range.firstCol}${row}`,
      widthPt: range.widthPt,
      heightPt: heightOfRows(contentRows, row, imageRowSpan),
      source: content.image.source,
      assetImageId: content.image.assetImageId,
    });
    row += imageRowSpan;
  }

  return { cells, merges, pendingImages, rowsUsed: row - startRow };
}

/**
 * Places `entries` (already filtered to `primary` visibility and ordered)
 * into a block's content rows. Four shapes of content, per D-102/ADIM 1
 * side-by-side round: `lines` stack one wrapped text line per row (Phase 4
 * default); `image` reserves `rowSpan` rows for a chart/diagram instead of
 * text; `zones` (mutually exclusive with the other two) hands
 * `placeZonesContent`'s horizontal partition either the entry's *entire*
 * remaining row-span (no `zonesRowSpan`, Phase 5/D-38's original
 * one-zoned-entry-per-block assumption) or an explicit slice of it
 * (D-224); `widthFraction` (2026-09-17) groups consecutive entries that
 * all declare one (`groupIntoRuns`) so they share the block's width
 * side by side instead of stacking, each using its own full row demand.
 * An entry is placed only if everything it needs fits the remaining
 * budget — never split across primary/appendix.
 */
export function placeBlockContent(
  entries: readonly Entry[],
  block: TemplateBlock,
  contentRows: readonly RowDef[],
  contentColumnWidths: readonly ColumnWidth[],
  rendererMap: A3EntryRendererMap,
  language: ProjectModel["meta"]["language"],
): PlacedBlockContent {
  const cells: CellData[] = [];
  const merges: MergedRange[] = [];
  const placedEntryIds: string[] = [];
  const droppedEntryIds: string[] = [];
  const pendingImages: PendingImageSlot[] = [];

  const blockWidthPt = contentColumnWidths.reduce((sum, column) => sum + column.widthPt, 0);
  const lastRow = block.contentRows.end;
  let row = block.contentRows.start;

  const resolved = entries.map((entry) => ({
    entry,
    content: resolveEntryContent(
      entry.methodId,
      entry.payload,
      { id: entry.id, title: entry.title, language, images: entry.images },
      rendererMap,
    ),
  }));

  const runs = groupIntoRuns(resolved, (item) => item.content);

  for (const run of runs) {
    if (run.sideBySide) {
      const groupStartRow = row;
      const ranges = splitColumnsIntoZones(
        run.items.map((item) => ({ widthFraction: item.content.widthFraction! })),
        contentColumnWidths,
      );

      let groupRowsUsed = 0;
      run.items.forEach((item, index) => {
        // `splitColumnsIntoZones` only ever drops a contiguous SUFFIX (see
        // its own doc comment) — an index past `ranges.length` genuinely
        // has no columns left, same D-107 "route the whole entry to an
        // appendix" rule as everywhere else.
        const zoneRange = ranges[index];
        if (!zoneRange) {
          droppedEntryIds.push(item.entry.id);
          return;
        }
        const placed = placeEntryContent(
          item.entry,
          item.content,
          { firstCol: zoneRange.firstCol, lastCol: zoneRange.lastCol, widthPt: zoneRange.widthPt },
          groupStartRow,
          lastRow,
          contentRows,
        );
        if (!placed) {
          droppedEntryIds.push(item.entry.id);
          return;
        }
        cells.push(...placed.cells);
        merges.push(...placed.merges);
        pendingImages.push(...placed.pendingImages);
        placedEntryIds.push(item.entry.id);
        groupRowsUsed = Math.max(groupRowsUsed, placed.rowsUsed);
      });

      row = groupStartRow + groupRowsUsed;
      continue;
    }

    const { entry, content } = run.items[0]!;

    if (content.zones) {
      // D-224: a `zonesRowSpan`-less zoned entry claims the whole remaining
      // band (Phase 5/D-38's original one-zoned-entry-per-block assumption,
      // preserved exactly for `smartTarget`). An explicit `zonesRowSpan`
      // lets a *second* zoned entry follow in the same block — see
      // `placeZonesContent`'s own doc comment for why this couldn't be
      // inferred from zone content alone.
      const requestedSpan = content.zonesRowSpan ?? lastRow - row + 1;
      const zoneLastRow = Math.min(row + requestedSpan - 1, lastRow);
      const placed = placeZonesContent(
        entry.id,
        content.zones,
        row,
        zoneLastRow,
        contentRows,
        contentColumnWidths,
      );
      if (!placed) {
        droppedEntryIds.push(entry.id);
        continue;
      }
      cells.push(...placed.cells);
      merges.push(...placed.merges);
      pendingImages.push(...placed.pendingImages);
      placedEntryIds.push(entry.id);
      row = zoneLastRow + 1;
      continue;
    }

    const placed = placeEntryContent(
      entry,
      content,
      { firstCol: block.contentColumns.first, lastCol: block.contentColumns.last, widthPt: blockWidthPt },
      row,
      lastRow,
      contentRows,
    );
    if (!placed) {
      droppedEntryIds.push(entry.id);
      continue;
    }
    cells.push(...placed.cells);
    merges.push(...placed.merges);
    pendingImages.push(...placed.pendingImages);
    placedEntryIds.push(entry.id);
    row += placed.rowsUsed;
  }

  return { cells, merges, placedEntryIds, droppedEntryIds, pendingImages };
}
