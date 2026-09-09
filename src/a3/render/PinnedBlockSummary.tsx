import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { StepId } from "../../domain/model";
import type { A3LayoutDescriptor, ElasticBlockGeometry } from "../descriptor";
import { canvasRowsOf, lastBlockOfEachColumn } from "./elasticColumns";

/**
 * Faz 11/L3b (D-170) + P-64 (D-231): the non-drag half of the drag-handle
 * feature. Two independent rows, both plain document flow (rendered by the
 * caller ABOVE or beside the grid, never inside the `position: relative`
 * wrapper `BlockPinOverlay` shares with `HtmlA3Renderer` — no pixel geometry
 * needed here):
 *
 *  1. "Currently pinned" chips + reset — one per block that already carries
 *     a `pinnedCanvasRows`, however it got pinned (drag or manual entry).
 *  2. "Manual entry" — one numeric-input row per column's LAST block
 *     (`lastBlockOfEachColumn`, `elasticColumns.ts`). `BlockPinOverlay`'s own
 *     draggable bars never grow one of these — nothing sits below a column's
 *     last block to anchor a boundary handle against — so this is the only
 *     way to pin one directly at all (P-64's own Seçenek B, Barış's choice
 *     over "the neighbour's handle simulates it," which risked a handle
 *     that visually sits near the last block but actually resizes its
 *     neighbour instead). Always rendered, pinned or not — typing the same
 *     value the block already has is a no-op (mirrors
 *     `BlockPinOverlay`'s own "no real change, don't dispatch" rule).
 */
export interface PinnedBlockSummaryProps {
  readonly descriptor: A3LayoutDescriptor;
  /** `canvasRows === null` means "reset to automatic" (clear this block's pin) — the same shape `BlockPinOverlay.onPinBlock` already uses. */
  readonly onPinBlock: (stepId: StepId, canvasRows: number | null) => void;
}

interface ManualPinRowProps {
  readonly block: ElasticBlockGeometry;
  readonly onPinBlock: (stepId: StepId, canvasRows: number) => void;
}

function ManualPinRow({ block, onPinBlock }: ManualPinRowProps) {
  const { t } = useTranslation();
  const stepId = block.stepIds[0];
  const currentRows = canvasRowsOf(block);

  if (stepId === undefined) {
    return null;
  }

  const inputId = `block-pin-manual-input-${stepId}`;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Re-check even though the enclosing guard above already ruled this
    // out — TS narrowing of a captured const does not survive into a
    // nested function declaration (the same closure-narrowing class
    // AssistantPanel.tsx's handleAccept / LayoutReviewPanel.tsx's
    // handleAnalyze already hit), so this stays unreachable at runtime but
    // is required for `stepId` to type as non-undefined here.
    if (stepId === undefined) {
      return;
    }
    const raw = new FormData(event.currentTarget).get("rows");
    const parsed = typeof raw === "string" ? Number.parseInt(raw, 10) : NaN;
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return;
    }
    const clamped = Math.max(block.minimumCanvasRows, parsed);
    if (clamped !== currentRows) {
      onPinBlock(stepId, clamped);
    }
  }

  return (
    <form
      role="listitem"
      onSubmit={handleSubmit}
      className="flex items-center gap-1 rounded-control border border-border bg-surface px-2 py-0.5 font-body text-2xs text-ink-muted"
    >
      <label htmlFor={inputId}>{t("workspace.blockPin.manualEntryLabel", { step: stepId })}</label>
      {/*
       * Uncontrolled, keyed by the block's own current row count: a
       * `useState` here would go stale the moment this block's size changes
       * through any OTHER path (a drag on a sibling column, a reset click),
       * since a per-keystroke controlled value has no reason to resync on
       * its own. Keying on `currentRows` remounts the input with a fresh
       * `defaultValue` exactly when the real size changes, without a
       * `useEffect`.
       */}
      <input
        key={currentRows}
        id={inputId}
        name="rows"
        type="number"
        min={block.minimumCanvasRows}
        step={1}
        defaultValue={currentRows}
        className="w-14 rounded border border-border bg-transparent px-1 text-center"
      />
      <button type="submit" className="text-accent hover:underline">
        {t("workspace.blockPin.manualEntryApply")}
      </button>
    </form>
  );
}

export function PinnedBlockSummary({ descriptor, onPinBlock }: PinnedBlockSummaryProps) {
  const { t } = useTranslation();
  const pinned = descriptor.elasticBlocks.filter((block) => block.pinnedCanvasRows !== undefined);
  const manualRows = lastBlockOfEachColumn(descriptor.elasticBlocks);

  if (pinned.length === 0 && manualRows.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {pinned.length > 0 && (
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
                  onClick={() => onPinBlock(stepId, null)}
                  className="text-accent hover:underline"
                  aria-label={t("workspace.blockPin.resetAriaLabel", { step: stepId })}
                >
                  {t("workspace.blockPin.resetToAutomatic")}
                </button>
              </span>
            );
          })}
        </div>
      )}
      {manualRows.length > 0 && (
        <div
          className="flex flex-wrap gap-1"
          role="list"
          aria-label={t("workspace.blockPin.manualEntryGroupLabel")}
        >
          {manualRows.map((block) => {
            const stepId = block.stepIds[0];
            if (stepId === undefined) {
              return null;
            }
            return <ManualPinRow key={`manual-pin-${stepId}`} block={block} onPinBlock={onPinBlock} />;
          })}
        </div>
      )}
    </div>
  );
}
