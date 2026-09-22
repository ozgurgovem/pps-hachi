import type { ColumnDef, RowDef, SheetDescriptor } from "../../../a3/descriptor";
import { excelColumnWidthToPt } from "../../../a3/layout/measure";

export interface Viewport {
  readonly scale: number;
  /** Pixel translate of the content's top-left corner, relative to the viewport. */
  readonly originX: number;
  readonly originY: number;
}

export const MIN_SCALE = 0.1;
export const MAX_SCALE = 4;
/** Multiplicative step per wheel "notch" — a physical mouse wheel reports ~100 per notch. */
const WHEEL_ZOOM_SENSITIVITY = 0.0015;

export function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

/**
 * `HtmlA3Renderer` maps 1 pt = 1 px at 100% (`screen` mode's own `PT_TO_PX`
 * is 96/72 — same ratio, kept here as a private duplicate rather than an
 * import, since importing a rendering-component constant into pure math
 * would be the wrong dependency direction; both trace back to the same
 * CSS-pixel-per-point convention and would only disagree if one of them
 * changed without the other, which a `HtmlA3Renderer` snapshot test would
 * already catch).
 */
const PT_TO_PX = 96 / 72;

export function columnWidthPx(column: ColumnDef): number {
  return excelColumnWidthToPt(column.charWidth) * PT_TO_PX;
}

export function rowHeightPx(row: RowDef): number {
  return row.heightPt * PT_TO_PX;
}

/**
 * The descriptor has no single "total sheet size" field — width is the sum
 * of column widths (Excel character-width units, converted via
 * `excelColumnWidthToPt`), height is the sum of row heights (already in
 * points). Both convert to CSS pixels at `screen` mode's 1pt=1px(*96/72)
 * convention, matching what `HtmlA3Renderer` actually paints.
 */
export function sheetSizePx(sheet: SheetDescriptor): { readonly widthPx: number; readonly heightPx: number } {
  return {
    widthPx: sheet.columns.reduce((sum, column) => sum + columnWidthPx(column), 0),
    heightPx: sheet.rows.reduce((sum, row) => sum + rowHeightPx(row), 0),
  };
}

/**
 * The scale that fits the whole sheet inside a `containerWidthPx` ×
 * `containerHeightPx` box, preserving aspect ratio — the smaller of the two
 * axis fits, so neither dimension overflows. Never exceeds 1 (a small sheet
 * is shown at its natural size, not stretched to fill the window).
 */
export function fitToWindowScale(
  sheetWidthPx: number,
  sheetHeightPx: number,
  containerWidthPx: number,
  containerHeightPx: number,
): number {
  if (sheetWidthPx <= 0 || sheetHeightPx <= 0 || containerWidthPx <= 0 || containerHeightPx <= 0) {
    return 1;
  }
  const fit = Math.min(containerWidthPx / sheetWidthPx, containerHeightPx / sheetHeightPx);
  return clampScale(Math.min(1, fit));
}

/**
 * Zooms so the content point currently under the cursor stays under the
 * cursor — the standard "zoom at cursor" interaction (Figma, Google Maps,
 * every serious canvas viewer). `pointerX`/`pointerY` are viewport-relative
 * (e.g. `event.clientX - container.getBoundingClientRect().left`).
 *
 * `wheelDeltaY` follows the DOM `WheelEvent` convention: negative means the
 * wheel moved "up" (scroll-in gesture, zoom in); positive means "down"
 * (zoom out).
 */
export function zoomAtPoint(current: Viewport, pointerX: number, pointerY: number, wheelDeltaY: number): Viewport {
  const nextScale = clampScale(current.scale * Math.exp(-wheelDeltaY * WHEEL_ZOOM_SENSITIVITY));
  if (nextScale === current.scale) {
    return current;
  }
  const contentX = (pointerX - current.originX) / current.scale;
  const contentY = (pointerY - current.originY) / current.scale;
  return {
    scale: nextScale,
    originX: pointerX - contentX * nextScale,
    originY: pointerY - contentY * nextScale,
  };
}

/** Recenters the fitted sheet in the viewport rather than pinning it to the top-left corner. */
export function centeredOrigin(
  scale: number,
  sheetWidthPx: number,
  sheetHeightPx: number,
  containerWidthPx: number,
  containerHeightPx: number,
): { readonly originX: number; readonly originY: number } {
  return {
    originX: (containerWidthPx - sheetWidthPx * scale) / 2,
    originY: (containerHeightPx - sheetHeightPx * scale) / 2,
  };
}

export function panBy(current: Viewport, deltaX: number, deltaY: number): Viewport {
  return { ...current, originX: current.originX + deltaX, originY: current.originY + deltaY };
}

/**
 * A step's own block is usually NARROWER than the band it sits in — half the
 * sheet, roughly 660px against a ~970px band. `fitToWindowScale` (the pop-out
 * window's own helper) deliberately never magnifies past 1:1, which is right
 * for a whole sheet but wrong here: it left this step's block at 1:1 in a
 * wider band, so the leftover space showed the NEIGHBOURING blocks under a
 * heading that says "bu adımın alanı", and threw away readability the band
 * had room to give.
 *
 * This fit may magnify, bounded, and is capped by the band's own height so a
 * tall block still fits. Kept local rather than changed in `zoomMath.ts` —
 * the pop-out window's never-magnify convention (D-133) is deliberate and
 * stays.
 */
const MAX_BAND_MAGNIFICATION = 2.5;

export function fitBlockToBandScale(
  blockWidthPx: number,
  blockHeightPx: number,
  containerWidthPx: number,
  maxHeightPx: number,
): number {
  if (blockWidthPx <= 0 || blockHeightPx <= 0 || containerWidthPx <= 0 || maxHeightPx <= 0) {
    return 1;
  }
  const fit = Math.min(containerWidthPx / blockWidthPx, maxHeightPx / blockHeightPx);
  return Math.min(MAX_BAND_MAGNIFICATION, Math.max(0.05, fit));
}

