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

export interface TemplateBlock {
  /** The app's 8-step ids this printed block projects. [5, 6] for the merged countermeasures/implementation block. */
  readonly appSteps: readonly StepId[];
  readonly label: string;
  readonly headerRange: RangeRef;
  readonly headerFill: string;
  readonly headerStyleId: string;
  readonly bodyStyleId: string;
  readonly contentColumns: { readonly first: string; readonly last: string };
  readonly contentRows: { readonly start: number; readonly end: number };
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
}
