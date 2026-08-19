import type { Entry, ProjectModel } from "../../domain/model";
import type { CellData, MergedRange, RowDef } from "../descriptor";
import type { A3EntryRendererMap, A3ImageKind, A3TextTone } from "../methodContract";
import type { TemplateBlock } from "../templates/types";
import { ENTRY_CONTENT_FONT_PT, entryLineStyleId, type ColumnWidth } from "./contentStyle";
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
 * exclusive with the other two) hands the entry's entire remaining
 * row-span to `placeZonesContent`'s horizontal partition. An entry is
 * placed only if everything it needs fits the remaining budget — never
 * split across primary/appendix.
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
    const renderer = rendererMap[entry.methodId];
    const content = renderer
      ? renderer(entry.payload, { id: entry.id, title: entry.title, language, images: entry.images })
      : { lines: [{ text: entry.title, bold: true }] };

    if (content.zones) {
      const placed = placeZonesContent(
        entry.id,
        content.zones,
        row,
        lastRow,
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
      row = lastRow + 1;
      continue;
    }

    const wrappedLines: WrappedLine[] = [];
    for (const line of content.lines) {
      for (const text of wrapText(line.text, maxCharsPerLine)) {
        wrappedLines.push({ text, bold: line.bold, tone: line.tone });
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
        styleId: entryLineStyleId(line.bold, line.tone),
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
