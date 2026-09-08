import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useTranslation } from "react-i18next";
import type { A3LayoutDescriptor } from "../../../a3/descriptor";
import { fitScale } from "../../../a3/layout/measure";
import { BlockPinOverlay } from "../../../a3/render/BlockPinOverlay";
import { HtmlA3Renderer } from "../../../a3/render/HtmlA3Renderer";
import { PinnedBlockSummary } from "../../../a3/render/PinnedBlockSummary";
import type { StepId } from "../../../domain/model";
import { Button } from "../../../ui";
import { listenForDescriptorPush, requestBlockPin } from "./window";
import {
  centeredOrigin,
  fitToWindowScale,
  panBy,
  sheetSizePx,
  zoomAtPoint,
  type Viewport,
} from "./zoomMath";

const ZOOM_STEP_DELTA = 240;
const INITIAL_VIEWPORT: Viewport = { scale: 1, originX: 0, originY: 0 };

/**
 * The pop-out preview window's own route (2026-08-04). Deliberately a pure
 * consumer of an already-built `A3LayoutDescriptor` — it never calls
 * `buildProjectA3Layout`/the method registry itself, so it needs no
 * knowledge of `src/methods` or the project store at all, only the descriptor
 * `useA3PreviewSync` (W2/D-217; formerly `RightPanel`) pushes across
 * (`window.ts`'s handshake). This mirrors how
 * `HtmlA3Renderer` is already a dumb renderer of a finished descriptor
 * (D-94) — one layer up.
 */
export function A3PreviewWindow() {
  const { t } = useTranslation();
  const [descriptor, setDescriptor] = useState<A3LayoutDescriptor | null>(null);
  const [mode, setMode] = useState<"screen" | "print">("screen");
  const [viewport, setViewport] = useState<Viewport>(INITIAL_VIEWPORT);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasAppliedInitialFit = useRef(false);
  const isDragging = useRef(false);
  const dragStart = useRef({ pointerX: 0, pointerY: 0, originX: 0, originY: 0 });

  useEffect(() => {
    const unlisten = listenForDescriptorPush(setDescriptor);
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  /** Rendered pixel footprint of the current sheet — matches whatever `HtmlA3Renderer` actually paints in this `mode`. */
  function renderedSheetSizePx(current: A3LayoutDescriptor): { widthPx: number; heightPx: number } {
    const sheet = current.sheets.a3;
    const { widthPx, heightPx } = sheetSizePx(sheet);
    const modeScale = mode === "print" ? fitScale(sheet.rows, sheet.pageSetup.marginsIn) : 1;
    return { widthPx: widthPx * modeScale, heightPx: heightPx * modeScale };
  }

  function applyFitToWindow(current: A3LayoutDescriptor) {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const { widthPx, heightPx } = renderedSheetSizePx(current);
    const scale = fitToWindowScale(widthPx, heightPx, container.clientWidth, container.clientHeight);
    setViewport({ scale, ...centeredOrigin(scale, widthPx, heightPx, container.clientWidth, container.clientHeight) });
  }

  // Fit to window automatically, but only the first time a descriptor ever
  // arrives — re-fitting on every subsequent edit would yank a user's
  // manual zoom/pan back every time an unrelated part of the project
  // changes, which is worse than leaving it alone.
  useEffect(() => {
    if (descriptor && !hasAppliedInitialFit.current) {
      hasAppliedInitialFit.current = true;
      applyFitToWindow(descriptor);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [descriptor]);

  // Wheel-to-zoom needs a non-passive native listener — React's synthetic
  // `onWheel` is attached passively by default, so `preventDefault()` inside
  // a JSX handler is silently ignored (a well-known React gotcha) and the
  // browser's own scroll/zoom would still fire alongside this one.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    function handleWheel(event: WheelEvent) {
      event.preventDefault();
      const rect = container!.getBoundingClientRect();
      setViewport((current) =>
        zoomAtPoint(current, event.clientX - rect.left, event.clientY - rect.top, event.deltaY),
      );
    }
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    // Left-button or middle-button drag pans — there is nothing else to
    // interact with inside a read-only preview, so a plain left-drag is
    // unambiguous (Barış asked specifically for the middle button; left-drag
    // is added so trackpad users without a middle button can pan too).
    if (event.button !== 0 && event.button !== 1) {
      return;
    }
    isDragging.current = true;
    dragStart.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      originX: viewport.originX,
      originY: viewport.originY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isDragging.current) {
      return;
    }
    const start = dragStart.current;
    setViewport((current) =>
      panBy({ ...current, originX: start.originX, originY: start.originY }, event.clientX - start.pointerX, event.clientY - start.pointerY),
    );
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    isDragging.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function zoomFromButton(directionDeltaY: number) {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    setViewport((current) =>
      zoomAtPoint(current, container.clientWidth / 2, container.clientHeight / 2, directionDeltaY),
    );
  }

  /**
   * Faz 11/L3b (D-170): this window has no project store of its own
   * (D-133) — every pin change is forwarded to the main window instead,
   * which applies it and pushes back a fresh descriptor through the
   * existing `A3_PREVIEW_DESCRIPTOR_EVENT` channel this window already
   * listens on, so the result appears here exactly like any other edit.
   */
  function handlePinBlock(stepId: StepId, canvasRows: number | null) {
    void requestBlockPin({ stepId, ...(canvasRows === null ? {} : { canvasRows }) });
  }

  return (
    <div className="flex h-screen flex-col bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-border p-2">
        <div className="flex gap-1">
          <Button
            variant={mode === "screen" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setMode("screen")}
          >
            {t("workspace.rightPanel.screenMode")}
          </Button>
          <Button variant={mode === "print" ? "primary" : "ghost"} size="sm" onClick={() => setMode("print")}>
            {t("workspace.rightPanel.printMode")}
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => descriptor && applyFitToWindow(descriptor)}
            disabled={!descriptor}
          >
            {t("a3PreviewWindow.fitToWindow")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => zoomFromButton(ZOOM_STEP_DELTA)}>
            −
          </Button>
          <span className="w-12 text-center font-mono text-2xs text-ink-muted">
            {Math.round(viewport.scale * 100)}%
          </span>
          <Button variant="ghost" size="sm" onClick={() => zoomFromButton(-ZOOM_STEP_DELTA)}>
            +
          </Button>
        </div>
      </div>

      {descriptor && (
        <div className="border-b border-border p-2">
          <PinnedBlockSummary descriptor={descriptor} onResetBlock={(stepId) => handlePinBlock(stepId, null)} />
        </div>
      )}

      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden bg-surface-raised"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ cursor: isDragging.current ? "grabbing" : "grab" }}
      >
        {descriptor ? (
          <div
            style={{
              position: "absolute",
              transform: `translate(${viewport.originX}px, ${viewport.originY}px) scale(${viewport.scale})`,
              transformOrigin: "0 0",
            }}
          >
            <HtmlA3Renderer descriptor={descriptor} mode={mode} />
            <BlockPinOverlay
              descriptor={descriptor}
              mode={mode}
              onPinBlock={handlePinBlock}
              dragScale={viewport.scale}
            />
          </div>
        ) : (
          <p className="p-6 font-body text-sm text-ink-muted">{t("a3PreviewWindow.waiting")}</p>
        )}
      </div>
    </div>
  );
}
