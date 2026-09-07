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

/**
 * Deliberately its own small structural type rather than `A3TextLine`
 * itself — under `exactOptionalPropertyTypes`, `A3TextLine`'s `bold?`/`tone?`
 * cannot be assigned an explicit `undefined` (only omitted), which
 * `place.ts`'s `WrappedLine` (a plain object built field-by-field, not an
 * `A3TextLine` literal) needs to do.
 */
export interface StyleableLine {
  readonly bold?: boolean | undefined;
  readonly tone?: A3TextTone | undefined;
  readonly fillStyleId?: string | undefined;
}

/**
 * D-224: `fillStyleId` (a named, template-authored fill style) wins over
 * `tone`'s bold/tone lookup when a line sets it — used for `gapStatement`'s
 * Layer A goal-state bands and `fiveN1K`'s Layer B category chips
 * (`reference/TEMPLATE_ANALYSIS.md` §14.1), never for P-37's own inline
 * status glyph, which stays on the plain `entryLineStyleId` path.
 */
export function resolveLineStyleId(line: StyleableLine): string {
  return line.fillStyleId ?? entryLineStyleId(line.bold, line.tone);
}

export interface ColumnWidth {
  readonly key: string;
  readonly widthPt: number;
}
