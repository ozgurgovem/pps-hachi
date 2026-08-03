/** Must match the `entryContent`/`entryContentBold` style font size in templates/*.ts (D-40). */
export const ENTRY_CONTENT_FONT_PT = 19;
export const ENTRY_TITLE_STYLE_ID = "entryContentBold";
export const ENTRY_BODY_STYLE_ID = "entryContent";

export interface ColumnWidth {
  readonly key: string;
  readonly widthPt: number;
}
