import type { StepId } from "../../domain/model";
import { parseRange } from "../cellRef";
import type { A3LayoutDescriptor, SheetDescriptor } from "../descriptor";
import { getTemplateById } from "../templates/registry";
import { columnOffsetPx, columnWidthPx, rowHeightPx, rowOffsetPx } from "./gridGeometry";

/**
 * W3 (D-229): the step page's own live-cropped preview needs a step's
 * printed block rectangle in "world" (screen-mode, scale=1) pixels — the
 * same coordinate space `HtmlA3Renderer` paints in and `gridGeometry.ts`/
 * `BlockPinOverlay` already measure against (Faz 11/L3b). Reads whatever
 * `resolveElasticBlocks` already resolved for THIS project
 * (`descriptor.elasticBlocks`) when the step's block is elastic, falling
 * back to the template's static `TemplateBlock` otherwise (every
 * `farplas-7step-tr` block, and any `pps-8step-auto` block a future
 * template revision might ship non-elastic). Never recomputes placement —
 * same "read, don't rebuild" posture `BlockPinOverlay` already established.
 */
export interface BlockPixelRect {
  readonly leftPx: number;
  readonly topPx: number;
  readonly widthPx: number;
  readonly heightPx: number;
}

export function blockRectForStep(descriptor: A3LayoutDescriptor, stepId: StepId): BlockPixelRect | undefined {
  const sheet = descriptor.sheets.a3;

  const elastic = descriptor.elasticBlocks.find((block) => block.stepIds.includes(stepId));
  if (elastic) {
    return rectFromRanges(sheet, elastic.headerRange, elastic.contentColumns, elastic.contentRows.end);
  }

  const template = getTemplateById(descriptor.templateId);
  const staticBlock = template.blocks.find((block) => block.appSteps.includes(stepId));
  if (!staticBlock) {
    return undefined;
  }
  return rectFromRanges(sheet, staticBlock.headerRange, staticBlock.contentColumns, staticBlock.contentRows.end);
}

function rectFromRanges(
  sheet: SheetDescriptor,
  headerRange: string,
  contentColumns: { readonly first: string; readonly last: string },
  lastContentRow: number,
): BlockPixelRect | undefined {
  const headerStartRow = parseRange(headerRange).start.row;

  const leftPx = columnOffsetPx(sheet, contentColumns.first, 1);
  const lastColOffsetPx = columnOffsetPx(sheet, contentColumns.last, 1);
  const lastColWidthPx = columnWidthPx(sheet, contentColumns.last, 1);
  const topPx = rowOffsetPx(sheet, headerStartRow, 1);
  const lastRowOffsetPx = rowOffsetPx(sheet, lastContentRow, 1);
  const lastRowHeightPx = rowHeightPx(sheet, lastContentRow, 1);

  if (
    leftPx === undefined ||
    lastColOffsetPx === undefined ||
    lastColWidthPx === undefined ||
    topPx === undefined ||
    lastRowOffsetPx === undefined ||
    lastRowHeightPx === undefined
  ) {
    return undefined;
  }

  return {
    leftPx,
    topPx,
    widthPx: lastColOffsetPx + lastColWidthPx - leftPx,
    heightPx: lastRowOffsetPx + lastRowHeightPx - topPx,
  };
}
