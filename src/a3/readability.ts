/**
 * A3 ÇIKTI OKUNABİLİRLİK KURALI — Barış, 2026-09-22, DEĞİŞMEZ.
 *
 * "Adımların alanlarına yerleştirilecek tüm bilgiler, grafikler, tablolar vs
 * A3 çıktısı alındığında rahatlıkla okunabilir olmalı. Bu da yazılı olan her
 * şeyin (tablolardaki, grafiklerdeki fontlar vs) en az 10 pt büyüklüğünde
 * olması demek oluyor."
 *
 * Scope: every piece of text the APP places into a block's canvas — entry
 * text rendered into cells, and every label/number/axis tick inside a
 * rasterized chart or diagram. It deliberately does NOT cover the reference
 * form's own printed chrome (field labels, block titles, guidance strips),
 * which `PPS_A3_Problem_Solving_Template_Rev00.xlsx` itself authors at 8pt
 * and which the "birebir aynı" template-fidelity rule pins in place.
 *
 * There are two different units to get right, and confusing them is what
 * made every previous attempt at this fail:
 *
 * 1. **Cell text** is authored in points and then scaled by Excel's own
 *    fit-to-page factor. Printed size = `bodyFontPt × fitScale`, so the
 *    floor is a constraint on the TEMPLATE (see `A3Template.bodyFontPt`,
 *    gated by `templates.test.ts`).
 *
 * 2. **Chart/diagram text** is authored in CSS pixels inside an SVG that is
 *    rasterized at `widthPt × PT_TO_PX` pixels and then placed back onto the
 *    sheet at exactly `widthPt` points. That round trip means one image
 *    pixel is always exactly `1 / PT_TO_PX` points on the sheet — regardless
 *    of `RASTER_SCALE`, which only changes the PNG's resolution, never its
 *    printed size. So the floor is a constraint on the COMPONENT, and it is
 *    `minImageFontPx()` below.
 */

/** PT_TO_PX's own value, duplicated here so this module stays dependency-free and importable from `src/methods`. */
const PT_TO_PX = 96 / 72;

/** The printed floor, in points. Never lower this without Barış saying so. */
export const A3_MIN_PRINTED_FONT_PT = 10;

/**
 * Smallest font size, in CSS pixels, that a chart/diagram may use inside a
 * rasterized A3 image and still print at or above the floor.
 *
 * `fitScale` is the template's own Excel fit-to-page factor — 1 for a
 * template that prints at 100 % (`pps-8step-auto`). Values above 1 are
 * clamped to 1, because Excel's "fit to one page" only ever scales DOWN.
 *
 * 10pt at fitScale 1 works out to 13.34px — that is the number every chart
 * component in this repo is held to.
 */
export function minImageFontPx(fitScale = 1): number {
  const effective = Math.min(1, fitScale);
  return (A3_MIN_PRINTED_FONT_PT / effective) * PT_TO_PX;
}

/**
 * Clamps a would-be font size up to the floor. Components call this instead
 * of hardcoding a size, so shrinking a chart can never silently shrink its
 * type below the legibility floor — the chart runs out of room and drops
 * content (which is visible) rather than printing unreadably (which is not).
 */
export function readableFontPx(desiredPx: number, fitScale = 1): number {
  return Math.max(desiredPx, minImageFontPx(fitScale));
}
