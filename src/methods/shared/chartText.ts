import { minImageFontPx } from "../../a3/readability";

/**
 * OKUNABİLİRLİK TABANI (`src/a3/readability.ts`, Barış 2026-09-22 —
 * DEĞİŞMEZ) for the Recharts-based charts.
 *
 * Recharts sizes its own axis ticks and legend from its defaults, which are
 * well under the printed 10pt floor once the chart is rasterized onto an A3
 * sheet. Spreading these two objects onto every axis/legend keeps the floor
 * in ONE place instead of a literal per axis — there are eleven axes across
 * five chart components, and a floor repeated eleven times is a floor that
 * drifts.
 */
export const A3_AXIS_TICK = { fontSize: minImageFontPx() } as const;
export const A3_LEGEND_STYLE = { fontSize: minImageFontPx() } as const;
