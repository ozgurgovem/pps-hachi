import { parseRange } from "../cellRef";
import type { ProvisionalBlockMarker } from "../descriptor";
import type { ReadinessResult } from "../../domain/readiness";
import type { StepId } from "../../domain/model";
import type { TemplateBlock } from "../templates/types";

/**
 * SPEC.md §1.2 / G3 (D-198): a printed block is "provisional" when
 * `evaluateReadiness` flags ANY of the app steps it projects — OR across
 * `appSteps`, matching how a block like `farplas-7step-tr`'s [5, 6]
 * countermeasures+implementation block already merges two steps into one
 * printed space. Returns `undefined` when nothing to mark, mirroring
 * `computeOverflowWarning`'s own "record what happened, nothing more" shape.
 */
export function computeProvisionalBlockMarker(
  block: TemplateBlock,
  readinessByStep: Readonly<Record<StepId, ReadinessResult>>,
): ProvisionalBlockMarker | undefined {
  const isProvisional = block.appSteps.some((stepId) => readinessByStep[stepId].status === "flagged");
  if (!isProvisional) {
    return undefined;
  }

  const header = parseRange(block.headerRange);
  return {
    stepIds: block.appSteps,
    range: `${block.contentColumns.first}${header.start.row}:${block.contentColumns.last}${block.contentRows.end}`,
  };
}
