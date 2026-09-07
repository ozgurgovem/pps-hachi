import type { SheetDescriptor } from "../descriptor";
import { excelColumnWidthToPt } from "../layout/measure";

/**
 * Faz 11/L3b (D-170/D-226): `BlockPinOverlay`'s own pixel-geometry math —
 * a separate, pure file so it can never touch `HtmlA3Renderer.tsx` itself
 * (D-94's dumb-renderer contract, D-226's own "overlay outside the renderer"
 * decision). `HtmlA3Renderer` positions cells via CSS Grid track indices,
 * not raw pixel offsets, so an overlay drawn as a *sibling* (not a grid
 * child) needs its own cumulative pixel math — this reads the exact same
 * `sheet.columns`/`sheet.rows` fields and the same `PT_TO_PX` conversion
 * constant `HtmlA3Renderer` uses, so the two can never silently disagree
 * about where a cell boundary actually falls.
 */
const PT_TO_PX = 96 / 72;

/** Cumulative left-edge pixel offset of the column keyed `columnKey`, or `undefined` if the sheet has no such column. */
export function columnOffsetPx(sheet: SheetDescriptor, columnKey: string, scale: number): number | undefined {
  let offset = 0;
  for (const column of sheet.columns) {
    if (column.key === columnKey) {
      return offset;
    }
    offset += excelColumnWidthToPt(column.charWidth) * PT_TO_PX * scale;
  }
  return undefined;
}

/** Scaled pixel width of the column keyed `columnKey`, or `undefined` if the sheet has no such column. */
export function columnWidthPx(sheet: SheetDescriptor, columnKey: string, scale: number): number | undefined {
  const column = sheet.columns.find((candidate) => candidate.key === columnKey);
  return column === undefined ? undefined : excelColumnWidthToPt(column.charWidth) * PT_TO_PX * scale;
}

/** Cumulative top-edge pixel offset of the row at `rowIndex`, or `undefined` if the sheet has no such row. */
export function rowOffsetPx(sheet: SheetDescriptor, rowIndex: number, scale: number): number | undefined {
  let offset = 0;
  for (const row of sheet.rows) {
    if (row.index === rowIndex) {
      return offset;
    }
    offset += row.heightPt * PT_TO_PX * scale;
  }
  return undefined;
}

/** Scaled pixel height of the row at `rowIndex`, or `undefined` if the sheet has no such row. */
export function rowHeightPx(sheet: SheetDescriptor, rowIndex: number, scale: number): number | undefined {
  const row = sheet.rows.find((candidate) => candidate.index === rowIndex);
  return row === undefined ? undefined : row.heightPt * PT_TO_PX * scale;
}
