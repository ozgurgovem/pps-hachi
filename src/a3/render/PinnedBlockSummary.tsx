import { useTranslation } from "react-i18next";
import type { StepId } from "../../domain/model";
import type { A3LayoutDescriptor } from "../descriptor";

/**
 * Faz 11/L3b (D-170): the "reset to automatic" half of the drag-handle
 * feature — `BlockPinOverlay`'s own draggable bars have no room to host a
 * text control themselves (a column's LAST block has no boundary below it
 * to attach a handle to at all, so a pin on it could never be reset from a
 * handle), so this is a small, ordinary-document-flow list instead: one row
 * per currently-pinned block, always reachable regardless of which block is
 * pinned. Rendered by the caller ABOVE or beside the grid (never inside the
 * `position: relative` wrapper `BlockPinOverlay` shares with
 * `HtmlA3Renderer`) — plain buttons, no pixel geometry needed.
 */
export interface PinnedBlockSummaryProps {
  readonly descriptor: A3LayoutDescriptor;
  readonly onResetBlock: (stepId: StepId) => void;
}

export function PinnedBlockSummary({ descriptor, onResetBlock }: PinnedBlockSummaryProps) {
  const { t } = useTranslation();
  const pinned = descriptor.elasticBlocks.filter((block) => block.pinnedCanvasRows !== undefined);

  if (pinned.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1" role="list" aria-label={t("workspace.blockPin.summaryLabel")}>
      {pinned.map((block) => {
        const stepId = block.stepIds[0];
        if (stepId === undefined) {
          return null;
        }
        return (
          <span
            key={`pinned-block-${stepId}`}
            role="listitem"
            className="flex items-center gap-1 rounded-control border border-border bg-surface px-2 py-0.5 font-body text-2xs text-ink-muted"
          >
            {t("workspace.blockPin.pinnedChip", { step: stepId, rows: block.pinnedCanvasRows })}
            <button
              type="button"
              onClick={() => onResetBlock(stepId)}
              className="text-accent hover:underline"
              aria-label={t("workspace.blockPin.resetAriaLabel", { step: stepId })}
            >
              {t("workspace.blockPin.resetToAutomatic")}
            </button>
          </span>
        );
      })}
    </div>
  );
}
