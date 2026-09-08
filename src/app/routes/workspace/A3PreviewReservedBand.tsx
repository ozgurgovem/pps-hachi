import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { A3LayoutDescriptor } from "../../../a3/descriptor";
import { blockRectForStep } from "../../../a3/render/blockRectForStep";
import { HtmlA3Renderer } from "../../../a3/render/HtmlA3Renderer";
import type { StepId } from "../../../domain/model";
import { Button } from "../../../ui";
import { openOrFocusA3PreviewWindow } from "../a3PreviewWindow/window";
import { fitToWindowScale } from "../a3PreviewWindow/zoomMath";
import type { DescriptorResult } from "./useA3PreviewSync";

/**
 * W3 (D-229): the live, cropped-to-this-step A3 preview W1/W2 (D-217/D-228)
 * reserved space for. §2.2 (LOCKED, D-217): no new renderer — the FULL
 * `HtmlA3Renderer` paints the whole sheet at natural (screen-mode) size
 * inside an `overflow: hidden` window sized to this step's own block
 * rectangle (`blockRectForStep`, reads `descriptor.elasticBlocks` when the
 * block is elastic, the template's static geometry otherwise), shifted with
 * a `transform: scale(...) translate(-x, -y)` so that rectangle's top-left
 * corner lands at the window's own (0, 0) — exactly the same "read the
 * pixel geometry, never recompute placement" posture `BlockPinOverlay`/
 * `gridGeometry.ts` (Faz 11/L3b) already established. What renders here is
 * therefore pixel-identical to the same step's block in the real export —
 * there is no second drawing path.
 *
 * `descriptorResult`/`stepId` are props, not a second `useA3PreviewSync()`
 * call — §2.1's own measurement (a real Chromium run, `npx playwright`) found
 * a chart-bearing project costs ~50-75ms per rebuild (DOM rasterization)
 * against ~0.1ms for a chart-free one, and D-84 already writes `project` to
 * the store on every keystroke; calling the hook a second time here would
 * pay that cost twice per keystroke. `WorkspaceShell` builds it once and
 * hands it down (to both this component and `ProjectToolsBar`).
 *
 * The last successfully-built descriptor is kept in local state and stays
 * on screen while a newer one is (debounced-)loading — refreshing to a
 * loading placeholder on every keystroke would defeat the point of a "live"
 * preview. The waiting message only ever shows before the very first
 * successful build.
 */
const MAX_PREVIEW_HEIGHT_PX = 420;

export interface A3PreviewReservedBandProps {
  readonly stepId: StepId;
  readonly descriptorResult: DescriptorResult;
}

export function A3PreviewReservedBand({ stepId, descriptorResult }: A3PreviewReservedBandProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidthPx, setContainerWidthPx] = useState(0);
  const [lastGoodDescriptor, setLastGoodDescriptor] = useState<A3LayoutDescriptor | null>(null);

  useEffect(() => {
    if (descriptorResult.status === "ok") {
      setLastGoodDescriptor(descriptorResult.descriptor);
    }
  }, [descriptorResult]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerWidthPx(entry.contentRect.width);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const rect = lastGoodDescriptor ? blockRectForStep(lastGoodDescriptor, stepId) : undefined;
  // `fitToWindowScale` already returns 1 when `containerWidthPx` is still 0
  // (not yet measured — real browsers report this within a frame of mount;
  // jsdom's ResizeObserver stub never reports at all) and never scales up
  // past 1, matching the pop-out window's own "never magnify" convention.
  const scale = rect ? fitToWindowScale(rect.widthPx, rect.heightPx, containerWidthPx, MAX_PREVIEW_HEIGHT_PX) : 1;
  const isRefreshing = descriptorResult.status !== "ok" && lastGoodDescriptor !== null;

  return (
    <section className="flex flex-col gap-3 rounded-control border border-border bg-surface-raised p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-ink-muted">
          {t("workspace.stepPreview.title")}
        </h2>
        <div className="flex items-center gap-2">
          {lastGoodDescriptor && (
            <span className="rounded-full border border-accent px-2.5 py-0.5 font-mono text-2xs uppercase tracking-wide text-accent">
              {t("workspace.stepPreview.liveBadge")}
            </span>
          )}
          <Button variant="secondary" size="sm" onClick={() => void openOrFocusA3PreviewWindow()}>
            {t("workspace.stepOverview.openA3Preview")}
          </Button>
        </div>
      </div>
      <p className="font-body text-xs text-ink-muted">{t("workspace.stepPreview.caption")}</p>

      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-control border border-border bg-white"
        style={{ height: rect ? Math.max(1, Math.round(rect.heightPx * scale)) : 96 }}
      >
        {lastGoodDescriptor && rect ? (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              transform: `scale(${scale}) translate(${-rect.leftPx}px, ${-rect.topPx}px)`,
              transformOrigin: "0 0",
              opacity: isRefreshing ? 0.6 : 1,
              transition: "opacity 150ms ease",
            }}
          >
            <HtmlA3Renderer descriptor={lastGoodDescriptor} mode="screen" />
          </div>
        ) : (
          <p className="flex h-full items-center justify-center p-4 font-body text-sm text-ink-muted">
            {t("workspace.stepPreview.waiting")}
          </p>
        )}
      </div>
    </section>
  );
}
