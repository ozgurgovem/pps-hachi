import type { OverflowWarning } from "../descriptor";
import type { TemplateBlock } from "../templates/types";
import type { BlockBudget } from "./budget";
import type { PlacedBlockContent } from "./place";

/**
 * SPEC.md §2.3: the descriptor records *that* a block overflowed, not what
 * to do about it — returns `undefined` when everything fit.
 */
export function computeOverflowWarning(
  block: TemplateBlock,
  budget: BlockBudget,
  placement: PlacedBlockContent,
): OverflowWarning | undefined {
  if (placement.droppedEntryIds.length === 0) {
    return undefined;
  }

  const usedRows = placement.cells.length;
  const contentPt = Math.min(usedRows, budget.rowCount) * (budget.budgetPt / budget.rowCount);

  return {
    stepIds: block.appSteps,
    budgetPt: budget.budgetPt,
    contentPt,
    overflowByPt: Math.max(0, contentPt - budget.budgetPt),
    droppedEntryIds: placement.droppedEntryIds,
  };
}
