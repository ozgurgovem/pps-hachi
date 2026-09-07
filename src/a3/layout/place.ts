import type { Entry, ProjectModel } from "../../domain/model";
import type { CellData, MergedRange, RowDef } from "../descriptor";
import { resolveEntryContent, type A3EntryRendererMap, type A3ImageKind, type A3TextTone } from "../methodContract";
import type { TemplateBlock } from "../templates/types";
import { ENTRY_CONTENT_FONT_PT, resolveLineStyleId, type ColumnWidth } from "./contentStyle";
import { estimateCharsPerLine, wrapText } from "./measure";
import { placeZonesContent } from "./placeZones";

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

function heightOfRows(contentRows: readonly RowDef[], startRow: number, rowSpan: number): number {
  const endRow = startRow + rowSpan - 1;
  return contentRows
    .filter((row) => row.index >= startRow && row.index <= endRow)
    .reduce((sum, row) => sum + row.heightPt, 0);
}

/**
 * Places `entries` (already filtered to `primary` visibility and ordered)
 * into a block's content rows. Three shapes of content, per D-102: `lines`
 * stack one wrapped text line per row (Phase 4 default); `image` reserves
 * `rowSpan` rows for a chart/diagram instead of text; `zones` (mutually
 * exclusive with the other two) hands `placeZonesContent`'s horizontal
 * partition either the entry's *entire* remaining row-span (no
 * `zonesRowSpan`, Phase 5/D-38's original one-zoned-entry-per-block
 * assumption) or an explicit slice of it (D-224) — the latter is what lets
 * `pps-8step-auto`'s ADIM 1 host two independent zoned entries (`fiveN1K`,
 * `gapStatement`) top-to-bottom in one block. An entry is placed only if
 * everything it needs fits the remaining budget — never split across
 * primary/appendix.
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
  const maxCharsPerLine = estimateCharsPerLine(blockWidthPt, ENTRY_CONTENT_FONT_PT);
  const lastRow = block.contentRows.end;
  let row = block.contentRows.start;

  for (const entry of entries) {
    const content = resolveEntryContent(
      entry.methodId,
      entry.payload,
      { id: entry.id, title: entry.title, language, images: entry.images },
      rendererMap,
    );

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

    const wrappedLines: WrappedLine[] = [];
    for (const line of content.lines) {
      for (const text of wrapText(line.text, maxCharsPerLine)) {
        wrappedLines.push({ text, bold: line.bold, tone: line.tone, fillStyleId: line.fillStyleId });
      }
    }

    const imageRowSpan = content.image
      ? (content.image.rowSpan ?? lastRow - row - wrappedLines.length + 1)
      : 0;
    const totalRowSpan = wrappedLines.length + imageRowSpan;

    // An image needs at least one row of its own. Without the `<= 0` guard a
    // chart whose text exactly filled the block still counted as "placed"
    // and emitted a slot with `heightPt: 0`, anchored one row *past* the
    // block — the rasterizer would then capture a zero-height PNG and the
    // writer would embed it outside its own block. D-100's rule is that a
    // whole entry either fits or moves to an appendix; a chart with nowhere
    // to draw does not fit.
    const imageHasNoRoom = content.image !== undefined && imageRowSpan <= 0;
    if (totalRowSpan === 0 || row + totalRowSpan - 1 > lastRow || imageHasNoRoom) {
      droppedEntryIds.push(entry.id);
      continue;
    }

    for (const line of wrappedLines) {
      const ref = `${block.contentColumns.first}${row}`;
      cells.push({
        ref,
        value: line.text,
        styleId: resolveLineStyleId({ bold: line.bold, tone: line.tone, fillStyleId: line.fillStyleId }),
      });
      if (block.contentColumns.first !== block.contentColumns.last) {
        merges.push({ range: `${ref}:${block.contentColumns.last}${row}` });
      }
      row += 1;
    }

    if (content.image) {
      pendingImages.push({
        entryId: entry.id,
        kind: content.image.kind,
        spec: content.image.spec,
        anchorCell: `${block.contentColumns.first}${row}`,
        widthPt: blockWidthPt,
        heightPt: heightOfRows(contentRows, row, imageRowSpan),
        source: content.image.source,
        assetImageId: content.image.assetImageId,
      });
      row += imageRowSpan;
    }

    placedEntryIds.push(entry.id);
  }

  return { cells, merges, placedEntryIds, droppedEntryIds, pendingImages };
}
