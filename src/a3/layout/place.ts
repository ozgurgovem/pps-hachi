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
import { resolveLineStyleId, type ColumnWidth } from "./contentStyle";
import { estimateCharsPerLine, wrapText } from "./measure";
import { placeZonesContent, splitColumnsIntoZones } from "./placeZones";
import { allocateRunRows, entryRowDemand } from "./rowDemand";
import { groupIntoRuns, horizontalRunCapacity } from "./widthFractionGroups";

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
  bodyFontPt: number,
): PlacedEntryContent | undefined {
  const maxCharsPerLine = estimateCharsPerLine(range.widthPt, bodyFontPt);
  const wrappedLines: WrappedLine[] = [];
  for (const line of content.lines) {
    for (const text of wrapText(line.text, maxCharsPerLine)) {
      wrappedLines.push({ text, bold: line.bold, tone: line.tone, fillStyleId: line.fillStyleId });
    }
  }

  // Rows this entry may actually use, after its own text lines.
  const rowsLeftForImage = lastRow - startRow - wrappedLines.length + 1;
  // A declared `rowSpan` is a PREFERENCE, not a demand (2026-09-23). It used
  // to be taken literally, so an entry asking for more rows than its share
  // of the block was dropped to an appendix outright — a defect photo
  // marked "Birincil" vanished from ADIM 1 every time, because
  // `PHOTO_ROW_SPAN` is 10 and the two charts beside it had already been
  // given most of the block.
  //
  // Shrinking an image is not the truncation D-100 forbids: a picture drawn
  // in fewer rows is the same picture, scaled, while a dropped TEXT line
  // would genuinely lose content — which is why only the image span is
  // clamped here and the line count below still decides whether the entry
  // fits at all.
  const requestedImageRowSpan = content.image ? (content.image.rowSpan ?? rowsLeftForImage) : 0;
  const imageRowSpan = content.image ? Math.min(requestedImageRowSpan, rowsLeftForImage) : 0;
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
  /** The template's own `bodyFontPt` — what this block's text is actually rendered at, and therefore what line wrapping must be estimated against. */
  bodyFontPt: number,
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

  const horizontalCapacity =
    block.entryLayout === "horizontal" ? horizontalRunCapacity(blockWidthPt) : undefined;
  const runs = groupIntoRuns(resolved, (item) => item.content, horizontalCapacity);

  // Share the block's rows between its runs BEFORE placing any of them.
  //
  // Without this, an entry whose image declares no `rowSpan` takes every
  // remaining row (Phase 5/D-224's "fills whatever is left" fallback), so
  // the first such entry starves every entry after it — ADIM 1's two
  // side-by-side charts consumed all 22 rows and a third entry marked
  // "Birincil" was dropped to an appendix unconditionally (Barış,
  // 2026-09-23). A run's own need is the MAX of its members, never the sum:
  // a side-by-side pair shares one row band.
  const bodyRowHeightPt = contentRows[0]?.heightPt;
  const runDemands = runs.map((run) =>
    run.items.reduce((widest, item) => {
      const share = horizontalCapacity === undefined ? (item.content.widthFraction ?? 1) : 1 / run.items.length;
      const widthPt = run.sideBySide ? blockWidthPt * share : blockWidthPt;
      return Math.max(widest, entryRowDemand(item.content, widthPt, bodyFontPt, bodyRowHeightPt));
    }, 0),
  );
  const runRowBudgets = allocateRunRows(runDemands, lastRow - block.contentRows.start + 1);

  for (const [runIndex, run] of runs.entries()) {
    // The last row THIS run may use. A run that finishes early hands the
    // rows it did not need to the next one (`row` advances by what was
    // actually used, not by the budget), so nothing is wasted.
    const runLastRow = Math.min(lastRow, row + (runRowBudgets[runIndex] ?? 0) - 1);
    if (run.sideBySide) {
      const groupStartRow = row;
      // In a block-level horizontal layout the members need not declare a
      // fraction of their own — they simply share the block evenly.
      const evenShare = 1 / run.items.length;
      const ranges = splitColumnsIntoZones(
        run.items.map((item) => ({
          widthFraction: horizontalCapacity === undefined ? item.content.widthFraction! : evenShare,
        })),
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
          runLastRow,
          contentRows,
          bodyFontPt,
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
      // Deliberately the BLOCK's last row, not this run's share: a zoned
      // entry lays out TEXT, and squeezing it into fewer rows makes
      // `placeZonesContent` join lines into one cell that the fixed row
      // height then clips (D-189's own defect). Shrinking an IMAGE is safe
      // — it is the same picture, scaled — shrinking text is not, so the
      // per-run budget bounds images only.
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
      runLastRow,
      contentRows,
      bodyFontPt,
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
