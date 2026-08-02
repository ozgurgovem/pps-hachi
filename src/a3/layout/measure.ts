import type { PageMarginsIn, RowDef } from "../descriptor";

const A3_SHORT_EDGE_MM = 297;
const MM_TO_PT = 2.83465;
const IN_TO_PT = 72;

/**
 * Deliberately takes plain `rows`/`marginsIn` rather than an `A3Template` —
 * `HtmlA3Renderer` (D-94's carve-out of the purity boundary) needs this same
 * math from an already-built `A3LayoutDescriptor`'s `SheetDescriptor`, which
 * has no `A3Template` to hand back. One set of formulas, two shapes of caller.
 */

/** Printable height along the row axis, in pt, for A3 landscape given the sheet's margins. */
export function printableHeightPt(marginsIn: PageMarginsIn): number {
  return A3_SHORT_EDGE_MM * MM_TO_PT - (marginsIn.top + marginsIn.bottom) * IN_TO_PT;
}

/** Sum of every row's authored height — what Excel actually scales down to fit the page. */
export function contentHeightPt(rows: readonly RowDef[]): number {
  return rows.reduce((total, row) => total + row.heightPt, 0);
}

/** D-34: the ratio Excel's "fit to one page" applies — what the print-mode preview scales by. */
export function fitScale(rows: readonly RowDef[], marginsIn: PageMarginsIn): number {
  return printableHeightPt(marginsIn) / contentHeightPt(rows);
}

/**
 * D-40: minimum authored font size so printed size (authored × fitScale)
 * never drops below `printedFloorPt`. Ceiling, not floor/round — anything
 * less than the ceiling can print under the floor.
 */
export function authoredFontFloorPt(
  rows: readonly RowDef[],
  marginsIn: PageMarginsIn,
  printedFloorPt = 8,
): number {
  return Math.ceil(printedFloorPt / fitScale(rows, marginsIn));
}

/**
 * Excel column widths are stored in a font-relative "character" unit with
 * no universally correct point conversion — the actual on-screen width
 * depends on the workbook's default font metrics. This is the same
 * widely-used approximation openpyxl and similar libraries render with
 * (Calibri-11 max-digit-width ≈ 7 px + 5 px padding, at 96 DPI), used only
 * by `HtmlA3Renderer` for the screen preview. The Rust writer never uses
 * this — it passes `charWidth` to rust_xlsxwriter verbatim (D-04), which is
 * the actually-authoritative value Excel itself will render from.
 */
export function excelColumnWidthToPt(charWidth: number): number {
  const px = Math.round(charWidth * 7 + 5);
  return px * (IN_TO_PT / 96);
}

/**
 * Rough characters-per-line estimate for wrapping user-authored text into a
 * block's content rows. Deliberately conservative (favors wrapping too
 * early over overflowing a row) — text measurement is inherently
 * approximate without laying out real glyphs, which is exactly why D-40
 * asks for a warning rather than a promise of pixel-perfect fit.
 */
export function estimateCharsPerLine(widthPt: number, fontSizePt: number): number {
  const averageCharWidthPt = fontSizePt * 0.55;
  return Math.max(1, Math.floor(widthPt / averageCharWidthPt));
}

/** Greedy word-wrap into at most the given number of lines; returns the wrapped lines. */
export function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(/\s+/).filter((word) => word.length > 0);
  if (words.length === 0) {
    return [];
  }

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current.length === 0 ? word : `${current} ${word}`;
    if (candidate.length <= maxCharsPerLine || current.length === 0) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current.length > 0) {
    lines.push(current);
  }

  return lines;
}
