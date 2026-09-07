import type { StepId } from "../domain/model";

/**
 * D-03/D-04: the one artifact that feeds both `HtmlA3Renderer` (React, CSS
 * Grid) and the Rust `xlsx` writer (a dumb serializer, zero layout logic).
 * Every field here must be plain, JSON-serializable data — no functions, no
 * `Date`, no `Map`/`Set` — because it crosses the Tauri IPC boundary as JSON.
 */

export type BorderWeight = "thin" | "medium" | "thick";

export interface CellBorder {
  readonly top?: BorderWeight;
  readonly bottom?: BorderWeight;
  readonly left?: BorderWeight;
  readonly right?: BorderWeight;
  /** ARGB hex, e.g. "FF000000". Defaults to black in the renderer/writer if omitted. */
  readonly color?: string;
}

export type HorizontalAlign = "left" | "center" | "right";
export type VerticalAlign = "top" | "center" | "bottom";

export interface CellFont {
  readonly name: string;
  readonly sizePt: number;
  readonly bold?: boolean;
  readonly italic?: boolean;
  /** ARGB hex, e.g. "FF000000". */
  readonly color?: string;
}

export interface CellStyle {
  readonly id: string;
  readonly font: CellFont;
  /** ARGB hex fill, e.g. "FFFF0000". Omitted = no fill. */
  readonly fillColor?: string;
  readonly horizontalAlign?: HorizontalAlign;
  readonly verticalAlign?: VerticalAlign;
  readonly wrapText?: boolean;
  readonly border?: CellBorder;
}

/** A1-style cell reference, e.g. "B8". Always within the sheet's column/row grid. */
export type CellRef = string;
/** A1-style range, e.g. "B8:O8". */
export type RangeRef = string;

export interface CellData {
  readonly ref: CellRef;
  readonly value: string | number | null;
  readonly styleId?: string;
}

export interface MergedRange {
  readonly range: RangeRef;
}

export interface ColumnDef {
  readonly key: string;
  /** Native Excel character-width unit — passed to rust_xlsxwriter verbatim, no conversion. */
  readonly charWidth: number;
}

export interface RowDef {
  readonly index: number;
  readonly heightPt: number;
}

export interface ImagePlacement {
  readonly id: string;
  /** Base64-encoded image bytes. The writer/renderer never reads from disk (D-04). */
  readonly data: string;
  /**
   * D-118/D-193: `"image/jpeg"` for an ingested photo embedded straight
   * from its already-stored bytes (never rasterized) — `rust_xlsxwriter`'s
   * `Image::new_from_buffer` auto-detects the format from the buffer's own
   * signature, so this field is metadata only, not consulted by the writer
   * (`src-tauri/src/xlsx/writer.rs`), same as before this addition.
   */
  readonly mimeType: "image/png" | "image/jpeg";
  readonly anchorCell: CellRef;
  readonly offsetXPt?: number;
  readonly offsetYPt?: number;
  readonly widthPt: number;
  readonly heightPt: number;
}

export interface PageMarginsIn {
  readonly top: number;
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
}

export interface PageSetup {
  readonly paperSize: "A3";
  readonly orientation: "landscape";
  readonly fitToPage: true;
  readonly fitToWidth: 1;
  readonly fitToHeight: 1;
  readonly marginsIn: PageMarginsIn;
  readonly printArea: RangeRef;
  /** Excel's own "zoom on open" (SPEC.md §3.3: 70%), independent of fitToPage's print scale. */
  readonly zoomPercent: number;
}

export interface SheetDescriptor {
  readonly name: string;
  readonly columns: readonly ColumnDef[];
  readonly rows: readonly RowDef[];
  readonly merges: readonly MergedRange[];
  readonly cells: readonly CellData[];
  readonly images: readonly ImagePlacement[];
  readonly pageSetup: PageSetup;
  readonly freezePanes: false;
  readonly gridlinesVisible: false;
}

/**
 * SPEC.md §2.3: a block's printed cell budget can be exceeded by the sum of
 * its `primary` entries. The descriptor records *what happened*, not what
 * to do about it — the "move oldest to appendix" fix is a UI/command
 * concern (Phase 3's command dispatcher), never something buildA3Layout
 * decides on its own.
 */
export interface OverflowWarning {
  /** Usually one step; [5, 6] for the template block that merges "develop" and "implement". */
  readonly stepIds: readonly StepId[];
  readonly budgetPt: number;
  readonly contentPt: number;
  readonly overflowByPt: number;
  /** Entry ids that did not fit inside the block's budget, in the order they were dropped. */
  readonly droppedEntryIds: readonly string[];
}

/**
 * G3 (D-198): SPEC.md §1.2 — "the A3 preview marks the step 'provisional'"
 * when its `readiness` evaluation is flagged. Mirrors `OverflowWarning`'s own
 * shape: the descriptor records *which block, what rectangle*, never *how to
 * draw it* — `HtmlA3Renderer` and the Rust writer each render their own
 * visual treatment (a dashed outline, D-198) from this geometry alone.
 */
export interface ProvisionalBlockMarker {
  /** Usually one step; e.g. [5, 6] for the template block that merges "develop" and "implement". */
  readonly stepIds: readonly StepId[];
  /** The block's full printed rectangle — header row through its last content row, e.g. "B7:O21". */
  readonly range: RangeRef;
}

/**
 * Faz 11/L3b (D-170): geometry for every `.elastic`-declared block in THIS
 * project's resolved layout — the drag-handle overlay (`BlockPinOverlay`,
 * outside `HtmlA3Renderer`/D-94, shared by `RightPanel`'s in-panel preview
 * and the pop-out `A3PreviewWindow`, D-133) needs a block's rectangle and
 * floor to draw a handle and a "reset to automatic"/at-floor indicator,
 * without recomputing anything `resolveElasticBlocks` already resolved. A
 * non-elastic block (every `farplas-7step-tr` block) never appears here.
 */
export interface ElasticBlockGeometry {
  /** Usually one step; every `pps-8step-auto` block is 1:1 with a single app-step (D-224). */
  readonly stepIds: readonly StepId[];
  readonly contentColumns: { readonly first: string; readonly last: string };
  readonly headerRange: RangeRef;
  readonly contentRows: { readonly start: number; readonly end: number };
  readonly minimumCanvasRows: number;
  /**
   * The raw value from `ProjectModel.blockPins` when this block currently
   * carries a manual override — absent otherwise. May differ from this
   * block's actual resolved `contentRows` span if the solver had to clamp
   * it down to protect a neighbour's own floor (D-170's iron law).
   */
  readonly pinnedCanvasRows?: number;
}

export interface A3LayoutDescriptor {
  readonly templateId: string;
  readonly language: "tr" | "en";
  readonly styles: readonly CellStyle[];
  readonly sheets: {
    readonly a3: SheetDescriptor;
    readonly appendices: readonly SheetDescriptor[];
  };
  readonly overflowWarnings: readonly OverflowWarning[];
  readonly provisionalBlocks: readonly ProvisionalBlockMarker[];
  readonly elasticBlocks: readonly ElasticBlockGeometry[];
}
