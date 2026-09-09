import { useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { useTranslation } from "react-i18next";
import type { StepId } from "../../domain/model";
import type { A3LayoutDescriptor, ElasticBlockGeometry } from "../descriptor";
import { canvasRowsOf, groupElasticBlocksByColumn } from "./elasticColumns";
import { columnOffsetPx, columnWidthPx, rowHeightPx, rowOffsetPx } from "./gridGeometry";

/**
 * Faz 11/L3b (D-170/D-226): a manual override on top of L3a's automatic
 * elastic solver — a draggable bar at the boundary between two consecutive
 * `.elastic` blocks in the same column, letting the user pin the block
 * ABOVE the boundary to a fixed canvas-row count (the solver, already
 * tested in `elasticAllocation.test.ts`, re-solves everyone else around it,
 * never below any block's own floor). Deliberately lives OUTSIDE
 * `HtmlA3Renderer` (D-94's dumb-renderer contract, D-226's own decision) —
 * a sibling `<div>` inside the SAME `position: relative` wrapper the caller
 * already places `HtmlA3Renderer` in, using `gridGeometry.ts`'s own pixel
 * math (not CSS Grid tracks) to line up with the renderer's own cells.
 *
 * Callback-driven, not store/IPC-aware: `A3PreviewWindow` (which has no
 * store of its own, D-133 — it asks the main window instead, via
 * `requestBlockPin`) supplies its own `onPinBlock`, so this component itself
 * needs no knowledge of which surface it's rendered in. `ProjectToolsBar`'s
 * `useA3PreviewSync` (W2/D-217, the direct-store-access side of that same
 * request) is the only other caller of the same `handlePinBlock` shape.
 *
 * Screen mode only (Barış's own choice via `AskUserQuestion`) — print mode
 * is preview-only (D-34) and 1 pt = 1 px only holds in screen mode, so this
 * renders nothing at all when `mode === "print"`.
 *
 * Commit-on-release, not live layout rebuild (Barış's own choice): dragging
 * only moves this bar's own visual position; the real `blockPins.set`
 * command is dispatched once, on `pointerup`, via `onPinBlock`.
 */
export interface BlockPinOverlayProps {
  readonly descriptor: A3LayoutDescriptor;
  readonly mode: "screen" | "print";
  /** `canvasRows === null` means "reset to automatic" (clear this block's pin). */
  readonly onPinBlock: (stepId: StepId, canvasRows: number | null) => void;
  /**
   * A3PreviewWindow (D-133): when this overlay is rendered inside a CSS
   * `transform: scale(...)` ancestor (the pop-out window's own zoom/pan,
   * `zoomMath.ts`), the browser already scales the handles' own visual
   * position for free — but `event.clientY` deltas arrive in unscaled
   * SCREEN pixels regardless of zoom, so a raw delta must be divided by
   * this factor before it means "sheet pixels" and can be converted to row
   * counts. This overlay is only ever rendered inside `A3PreviewWindow` as of
   * W2/D-217 (the old in-panel preview it also used to render inside is
   * gone) — the default (1) exists only for a future non-scaled caller.
   */
  readonly dragScale?: number;
}

const HANDLE_HEIGHT_PX = 8;

interface DragState {
  readonly stepId: StepId;
  readonly startClientY: number;
  readonly startCanvasRows: number;
  readonly minimumCanvasRows: number;
  readonly rowHeightPxAtBlock: number;
  readonly deltaPx: number;
}

export function BlockPinOverlay({ descriptor, mode, onPinBlock, dragScale = 1 }: BlockPinOverlayProps) {
  const { t } = useTranslation();
  const [drag, setDrag] = useState<DragState | null>(null);

  if (mode !== "screen" || descriptor.elasticBlocks.length === 0) {
    return null;
  }

  const sheet = descriptor.sheets.a3;

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>, above: ElasticBlockGeometry) {
    if (event.button !== 0) {
      return;
    }
    const stepId = above.stepIds[0];
    if (stepId === undefined) {
      return;
    }
    // A3PreviewWindow (D-133) wraps this overlay in its own pan container
    // with a sibling `onPointerDown` handler — without stopping
    // propagation, starting a drag on a handle would also start a pan
    // gesture underneath it (React's synthetic events bubble by default).
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({
      stepId,
      startClientY: event.clientY,
      startCanvasRows: canvasRowsOf(above),
      minimumCanvasRows: above.minimumCanvasRows,
      rowHeightPxAtBlock: rowHeightPx(sheet, above.contentRows.start, 1) ?? 1,
      deltaPx: 0,
    });
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!drag) {
      return;
    }
    event.stopPropagation();
    // `event.clientY` is always raw screen pixels, regardless of any
    // ancestor zoom transform (`dragScale`) — divide first so `deltaPx`
    // stays in the SAME "sheet pixel" space `rowHeightPxAtBlock` is
    // measured in, both for the row-count math below and for this handle's
    // own visual offset (which the ancestor transform then re-scales for
    // free, exactly matching the zoomed sheet underneath it).
    const rawDeltaPx = (event.clientY - drag.startClientY) / dragScale;
    const minDeltaPx = -(drag.startCanvasRows - drag.minimumCanvasRows) * drag.rowHeightPxAtBlock;
    setDrag({ ...drag, deltaPx: Math.max(rawDeltaPx, minDeltaPx) });
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (!drag) {
      return;
    }
    event.stopPropagation();
    event.currentTarget.releasePointerCapture(event.pointerId);
    const deltaRows = Math.round(drag.deltaPx / drag.rowHeightPxAtBlock);
    const finalRows = Math.max(drag.minimumCanvasRows, drag.startCanvasRows + deltaRows);
    if (finalRows !== drag.startCanvasRows) {
      onPinBlock(drag.stepId, finalRows);
    }
    setDrag(null);
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>, above: ElasticBlockGeometry) {
    const stepId = above.stepIds[0];
    if (stepId === undefined) {
      return;
    }
    const current = canvasRowsOf(above);
    let next: number | undefined;
    if (event.key === "ArrowUp") {
      event.preventDefault();
      next = Math.max(above.minimumCanvasRows, current - 1);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      next = current + 1;
    }
    // Same guard as the drag handler: an already-floored block pressed
    // ArrowUp has nothing to shrink into, and must not silently create a
    // pin at its current (unchanged) value.
    if (next !== undefined && next !== current) {
      onPinBlock(stepId, next);
    }
  }

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {groupElasticBlocksByColumn(descriptor.elasticBlocks).flatMap((column) =>
        column.slice(0, -1).map((above) => {
          const stepId = above.stepIds[0];
          if (stepId === undefined) {
            return null;
          }
          const isDraggingThis = drag?.stepId === stepId;
          const boundaryRow = above.contentRows.end;
          const boundaryTopPx =
            (rowOffsetPx(sheet, boundaryRow, 1) ?? 0) + (rowHeightPx(sheet, boundaryRow, 1) ?? 0);
          const leftPx = columnOffsetPx(sheet, above.contentColumns.first, 1) ?? 0;
          const rightPx =
            (columnOffsetPx(sheet, above.contentColumns.last, 1) ?? 0) +
            (columnWidthPx(sheet, above.contentColumns.last, 1) ?? 0);
          const widthPx = rightPx - leftPx;
          const atFloor = canvasRowsOf(above) <= above.minimumCanvasRows;

          return (
            <div
              key={`block-pin-handle-${stepId}`}
              role="separator"
              aria-orientation="horizontal"
              aria-label={t("workspace.blockPin.handleLabel", { step: stepId })}
              aria-valuenow={canvasRowsOf(above)}
              aria-valuemin={above.minimumCanvasRows}
              title={atFloor ? t("workspace.blockPin.atFloor") : undefined}
              tabIndex={0}
              onPointerDown={(event) => handlePointerDown(event, above)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onKeyDown={(event) => handleKeyDown(event, above)}
              style={{
                position: "absolute",
                left: leftPx,
                top: boundaryTopPx - HANDLE_HEIGHT_PX / 2 + (isDraggingThis ? drag.deltaPx : 0),
                width: widthPx,
                height: HANDLE_HEIGHT_PX,
                cursor: "row-resize",
                pointerEvents: "auto",
                background: isDraggingThis
                  ? "rgba(32, 36, 31, 0.6)"
                  : atFloor
                    ? "rgba(32, 36, 31, 0.12)"
                    : "rgba(32, 36, 31, 0.28)",
              }}
            />
          );
        }),
      )}
    </div>
  );
}
