import { estimateCharsPerLine, wrapText } from "../../a3/layout/measure";

/**
 * BVVL round 4 (2026-09-17, ADIM 1 Gap Analizi): a band's own text is never
 * wrapped just because a longer sibling band needs two lines — each band
 * independently prefers one line up to this length, and only past it does
 * it target the minimum width for a clean two-line split. Chosen so the
 * real EK-2905 band texts ("İdeal Durum: ...", "Mevcut Durum: ...") land on
 * one line while "Problem Tanımı: ..." (a full sentence) lands on two.
 */
const SINGLE_LINE_CAP_CHARS = 70;
/** A band's text never grows past two lines — see the module doc comment. */
const MAX_BAND_LINES = 2;

function neededCharsForBand(text: string): number {
  if (text.length <= SINGLE_LINE_CAP_CHARS) {
    return text.length;
  }
  for (let chars = Math.ceil(text.length / 2); chars <= SINGLE_LINE_CAP_CHARS; chars += 1) {
    if (wrapText(text, chars).length <= MAX_BAND_LINES) {
      return chars;
    }
  }
  return SINGLE_LINE_CAP_CHARS;
}

export interface GapBandsLayout {
  readonly widthPx: number;
  readonly wrappedBands: readonly (readonly string[])[];
}

/**
 * The chart and the three colour bands below it always share one width
 * (Barış's own correction, BVVL round 3: `place.ts` merges every `lines`
 * cell to the block's full width, so a separately-narrowed chart and
 * full-width band cells could never actually line up — the fix is drawing
 * both inside one image, never two primitives negotiating a shared column
 * range). This is the pure width/wrap math behind that image, kept
 * independently testable from the React component that draws it.
 */
export function layoutGapBands(
  bandTexts: readonly string[],
  fontPx: number,
  compactWidthPx: number,
  maxWidthPx: number,
): GapBandsLayout {
  const avgCharWidthPx = fontPx * 0.55;
  const compactChars = estimateCharsPerLine(compactWidthPx, fontPx);
  const maxChars = estimateCharsPerLine(maxWidthPx, fontPx);

  const neededChars = Math.max(compactChars, ...bandTexts.map(neededCharsForBand));
  const finalChars = Math.min(neededChars, maxChars);
  const widthPx = Math.min(maxWidthPx, Math.max(compactWidthPx, finalChars * avgCharWidthPx));
  const wrappedBands = bandTexts.map((text) => wrapText(text, finalChars));

  return { widthPx, wrappedBands };
}
