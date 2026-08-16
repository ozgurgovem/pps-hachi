import type { A3TextTone } from "../methodContract";

/** Must match the `entryContent`/`entryContentBold` style font size in templates/*.ts (D-40). */
export const ENTRY_CONTENT_FONT_PT = 19;
export const ENTRY_TITLE_STYLE_ID = "entryContentBold";
export const ENTRY_BODY_STYLE_ID = "entryContent";

/**
 * P-37: tone-specific variants of the two style ids above, one triple per
 * bold/non-bold — must match the `entryContent{Bold?}{Tone}` ids in
 * templates/*.ts. Colour values come from D-165's Layer A palette, shared
 * with `gapStatement`'s colour band and ADIM 7's `kpi-strip`.
 */
const ENTRY_BODY_TONE_STYLE_IDS: Readonly<Record<A3TextTone, string>> = {
  positive: "entryContentPositive",
  caution: "entryContentCaution",
  negative: "entryContentNegative",
};

const ENTRY_TITLE_TONE_STYLE_IDS: Readonly<Record<A3TextTone, string>> = {
  positive: "entryContentBoldPositive",
  caution: "entryContentBoldCaution",
  negative: "entryContentBoldNegative",
};

/** Picks the style id for one wrapped content line, folding D-41's tone reinforcement into the existing bold/non-bold choice. */
export function entryLineStyleId(bold: boolean | undefined, tone: A3TextTone | undefined): string {
  if (tone) {
    return bold ? ENTRY_TITLE_TONE_STYLE_IDS[tone] : ENTRY_BODY_TONE_STYLE_IDS[tone];
  }
  return bold ? ENTRY_TITLE_STYLE_ID : ENTRY_BODY_STYLE_ID;
}

export interface ColumnWidth {
  readonly key: string;
  readonly widthPt: number;
}
