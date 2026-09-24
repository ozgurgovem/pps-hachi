import type { StepId } from "../../domain/model";
import type {
  CellStyle,
  ColumnDef,
  MergedRange,
  PageMarginsIn,
  RangeRef,
  RowDef,
} from "../descriptor";

/**
 * reference/TEMPLATE_ANALYSIS.md §8: templates are data, not code.
 * `farplas-7step-tr.ts` is the first (and, for Phase 4, only) instance —
 * see DECISIONS.md D-95 for why `-en`/`-plus`/`pps-8step-auto` wait for
 * Phase 11.
 */

/** A single printed field label + its value cell, both already-existing merges. */
export interface TemplateField {
  readonly id: string;
  readonly labelRange: RangeRef;
  readonly label: string;
  readonly valueRange: RangeRef;
  readonly labelStyleId: string;
  readonly valueStyleId: string;
}

/** A static (unmerged) label cell — used for loss-taxonomy categories, work-plan step labels. */
export interface TemplateStaticCell {
  readonly ref: RangeRef;
  readonly value: string;
  readonly styleId: string;
}

/**
 * Rev00 fidelity (2026-09-22): the reference form draws a light-blue
 * guidance strip directly under most block titles — "Problemin net tanımı:
 * Ne? Nerede? Ne zaman? Ne kadar?" under ADIM 1, the "ID · Aksiyon ·
 * Sorumlu · Termin · Durum" column headers under ADIM 5, and so on. The
 * strip is part of the block's CHROME, not its canvas: it must travel with
 * the block whenever the elastic solver moves it, which is exactly why it
 * cannot be a fixed-ref `TemplateStaticCell` the way the `KAT` divider is.
 * Declared here, emitted by `buildA3Layout` on the LAST row of the block's
 * resolved `headerRange`.
 */
export interface TemplateSubHeaderCell {
  readonly firstCol: string;
  readonly lastCol: string;
  readonly value: string;
}

export interface TemplateBlock {
  /** The app's 8-step ids this printed block projects. [5, 6] for the merged countermeasures/implementation block. */
  readonly appSteps: readonly StepId[];
  readonly label: string;
  readonly headerRange: RangeRef;
  readonly headerFill: string;
  readonly headerStyleId: string;
  readonly bodyStyleId: string;
  readonly contentColumns: { readonly first: string; readonly last: string };
  /**
   * For an `elastic` block, this is its DEFAULT canvas-row span (D-158) —
   * the actual per-project span is computed by
   * `layout/elasticAllocation.ts`'s `resolveElasticBlocks`, never read
   * directly off the template. For a non-elastic block this is the literal,
   * unchanging span, exactly as before Faz 11/L3a.
   */
  readonly contentRows: { readonly start: number; readonly end: number };
  /**
   * Faz 11/L3a (D-158/D-160/D-223 madde 1, all LOCKED or as-recorded):
   * declares this block a member of an elastic column group — its column-
   * mates (blocks sharing `contentColumns`) share a fixed row total, and the
   * boundary between them moves per project based on each block's real
   * content demand, never below `minimumCanvasRows`. Omitted (the default,
   * every `farplas-7step-tr` block) means `contentRows`/`headerRange` are
   * used exactly as declared — nothing about that template's static
   * geometry changes.
   */
  readonly elastic?: { readonly minimumCanvasRows: number };
  /**
   * Rev00's own guidance/column-header strip for this block. When present,
   * `headerRange` spans the title row(s) PLUS one strip row, and the title
   * cell's merge covers everything except that last row. Omitted (every
   * `farplas-7step-tr` block, plus Rev00's own ADIM 4, which genuinely has
   * no strip) leaves the header behaving exactly as before.
   */
  readonly subHeader?: readonly TemplateSubHeaderCell[];
  /**
   * How this block arranges the entries inside it.
   *
   * Omitted (every block's behaviour before 2026-09-24) stacks each entry
   * down the block at full width, and only entries that individually
   * declare `A3BlockContent.widthFraction` sit beside each other.
   *
   * `"horizontal"` makes it a property of the BLOCK instead: every entry in
   * it shares the width, whatever the method declares. Barış's own
   * instruction for ADIM 1 (2026-09-24) — "her yeni gelen bilginin yatayda
   * yerleştirilmesi; dikeyde yerleştirildiğinde ciddi yer kaybı yaratıyor".
   * A stacked full-width entry is letterboxed into a wide, short box, so a
   * photo ends up tiny with cream waste on both sides; side by side it gets
   * a real share of the block. Entries wrap onto a further row once another
   * column would fall under `MIN_HORIZONTAL_ENTRY_WIDTH_PT`.
   */
  readonly entryLayout?: "horizontal";
}

export interface A3Template {
  readonly id: string;
  readonly name: string;
  readonly language: "tr" | "en";
  readonly columns: readonly ColumnDef[];
  readonly rows: readonly RowDef[];
  readonly merges: readonly MergedRange[];
  readonly styles: readonly CellStyle[];
  readonly titleRange: RangeRef;
  readonly headerFields: readonly TemplateField[];
  readonly staticCells: readonly TemplateStaticCell[];
  readonly footerFields: readonly TemplateField[];
  readonly blocks: readonly TemplateBlock[];
  readonly printArea: RangeRef;
  readonly marginsIn: PageMarginsIn;
  /** Body row height in pt — 1 content line per content row (D-40 legibility floor assumes this). */
  readonly bodyRowHeightPt: number;
  readonly zoomPercent: number;
  /**
   * The authored point size of this template's own `entryContent` style —
   * the single source of truth for line-wrap estimation (`place.ts`,
   * `elasticAllocation.ts`).
   *
   * It used to be one global constant (`ENTRY_CONTENT_FONT_PT = 19`)
   * derived from `farplas-7step-tr`'s own ~41 % fit scale, which silently
   * mis-wrapped every other template: `pps-8step-auto` renders its body
   * text at a completely different size and prints at 100 %, so wrapping it
   * against 19pt estimated far fewer characters per line than really fit.
   *
   * **İçerik okunabilirlik kuralı (Barış, 2026-09-22 — değişmez):** the
   * PRINTED size of this text is `bodyFontPt × fitScale`, and it must never
   * fall below `A3_MIN_PRINTED_FONT_PT`. `templates.test.ts` enforces this
   * mechanically for every registered template — it is a gate, not a
   * convention.
   */
  readonly bodyFontPt: number;
  /**
   * Style id painted onto every canvas cell a block leaves empty, so an
   * unfilled block still shows the reference form's own cream canvas
   * instead of bare white. Omitted leaves empty cells unpainted (every
   * pre-Rev00 template's behaviour).
   */
  readonly canvasFillStyleId?: string;
}
