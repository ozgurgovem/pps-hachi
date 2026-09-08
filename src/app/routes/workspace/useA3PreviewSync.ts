import { useEffect, useRef, useState } from "react";
import { buildSetBlockPinsCommand } from "../../../domain/commands";
import type { ProjectModel, StepId } from "../../../domain/model";
import type { A3LayoutDescriptor } from "../../../a3/descriptor";
import { useProjectStore } from "../../../state";
import {
  listenForBlockPinRequest,
  listenForPreviewReady,
  pushDescriptorToPreviewWindow,
} from "../a3PreviewWindow/window";
import { buildProjectA3Layout } from "./a3Preview";

export type DescriptorResult =
  | { readonly status: "loading" }
  | { readonly status: "ok"; readonly descriptor: A3LayoutDescriptor }
  | { readonly status: "error"; readonly error: unknown };

/**
 * W3 §2.3: matches `projectStore.ts`'s own `TEXT_COALESCE_WINDOW_MS` (D-84)
 * — a real, Chromium-measured number, not assumed: a chart-bearing project
 * (any step, not just the active one) makes `buildProjectA3Layout` cost
 * ~50-75ms (DOM rasterization), against ~0.1ms for a chart-free one. D-84
 * already writes `project` to the store on every keystroke, so without this,
 * a fast-typing burst would fire N overlapping ~50-75ms rebuilds. A separate
 * constant, not an import of `TEXT_COALESCE_WINDOW_MS` — that one governs
 * undo-command merging (a different concern that happens to share a tuning
 * value), not this effect's own rebuild trigger.
 */
const DEBOUNCE_MS = 600;

/**
 * W2/D-217: extracted out of the now-deleted `RightPanel` — its embedded
 * preview UI is gone (the pop-out window, D-133, already has its own
 * `HtmlA3Renderer`/`BlockPinOverlay`/`PinnedBlockSummary`, so nothing is
 * lost), but this build-and-sync machinery is still load-bearing: it is
 * the ONLY thing that keeps pushing a fresh descriptor to the pop-out
 * window, answers its ready handshake, forwards its pin-drag requests back
 * into the real store, and hands `ProjectToolsBar`/`A3PreviewReservedBand`
 * the descriptor they need (W3 — both now read the SAME build, called once
 * in `WorkspaceShell`, rather than each running their own — see D-229).
 * Mounted once, for the life of an open project.
 */
export function useA3PreviewSync(): DescriptorResult {
  const project = useProjectStore((s) => s.project);
  const otherEntries = useProjectStore((s) => s.otherEntries);
  const dispatch = useProjectStore((s) => s.dispatch);
  const [descriptorResult, setDescriptorResult] = useState<DescriptorResult>({ status: "loading" });
  const latestProject = useRef(project);
  latestProject.current = project;
  const hasBuiltOnce = useRef(false);
  // W3: updated SYNCHRONOUSLY in the same tick as the imperative
  // `pushDescriptorToPreviewWindow` call below — deliberately NOT derived
  // from `descriptorResult` via a render-synced ref. React's own state-update
  // flush is asynchronous relative to that synchronous call, and a ref that
  // only updates during render can still read stale ("loading") the instant
  // after a build resolves, racing the ready-handshake listener below (a
  // real, reproducible flake this fixed — not a hypothetical).
  const latestOkDescriptor = useRef<A3LayoutDescriptor | null>(null);

  function handlePinBlock(stepId: StepId, canvasRows: number | null) {
    const currentProject = latestProject.current;
    if (!currentProject) {
      return;
    }
    const nextPins = { ...currentProject.blockPins };
    if (canvasRows === null) {
      delete nextPins[stepId];
    } else {
      nextPins[stepId] = canvasRows;
    }
    dispatch(buildSetBlockPinsCommand(currentProject as ProjectModel, nextPins));
  }

  useEffect(() => {
    if (!project) {
      return;
    }
    let cancelled = false;
    // The very first build (opening a project) fires immediately — only
    // subsequent rebuilds (triggered by every keystroke, D-84) wait out the
    // debounce window, so opening a project never feels delayed.
    const delayMs = hasBuiltOnce.current ? DEBOUNCE_MS : 0;
    const timer = setTimeout(() => {
      if (cancelled) {
        return;
      }
      hasBuiltOnce.current = true;
      setDescriptorResult({ status: "loading" });
      buildProjectA3Layout(project, otherEntries).then(
        (descriptor) => {
          if (!cancelled) {
            latestOkDescriptor.current = descriptor;
            setDescriptorResult({ status: "ok", descriptor });
            void pushDescriptorToPreviewWindow(descriptor);
          }
        },
        (error: unknown) => {
          if (!cancelled) {
            setDescriptorResult({ status: "error", error });
          }
        },
      );
    }, delayMs);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [project, otherEntries]);

  useEffect(() => {
    const unlisten = listenForPreviewReady(() => {
      const descriptor = latestOkDescriptor.current;
      if (descriptor) {
        void pushDescriptorToPreviewWindow(descriptor);
      }
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  useEffect(() => {
    const unlisten = listenForBlockPinRequest((request) => {
      handlePinBlock(request.stepId, request.canvasRows ?? null);
    });
    return () => {
      unlisten.then((fn) => fn());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return descriptorResult;
}
