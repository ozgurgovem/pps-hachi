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
 * W2/D-217: extracted out of the now-deleted `RightPanel` — its embedded
 * preview UI is gone (the pop-out window, D-133, already has its own
 * `HtmlA3Renderer`/`BlockPinOverlay`/`PinnedBlockSummary`, so nothing is
 * lost), but this build-and-sync machinery is still load-bearing: it is
 * the ONLY thing that keeps pushing a fresh descriptor to the pop-out
 * window, answers its ready handshake, forwards its pin-drag requests back
 * into the real store, and hands `ProjectToolsBar` the descriptor Export/
 * Review need. Mounted once, for the life of an open project — from
 * `ProjectToolsBar`, which (unlike the old per-step `RightPanel`) is always
 * rendered via `WorkspaceTopBar`, on the landing view and every step page
 * alike.
 */
export function useA3PreviewSync(): DescriptorResult {
  const project = useProjectStore((s) => s.project);
  const otherEntries = useProjectStore((s) => s.otherEntries);
  const dispatch = useProjectStore((s) => s.dispatch);
  const [descriptorResult, setDescriptorResult] = useState<DescriptorResult>({ status: "loading" });
  const latestDescriptorResult = useRef(descriptorResult);
  latestDescriptorResult.current = descriptorResult;
  const latestProject = useRef(project);
  latestProject.current = project;

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
    setDescriptorResult({ status: "loading" });
    buildProjectA3Layout(project, otherEntries).then(
      (descriptor) => {
        if (!cancelled) {
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
    return () => {
      cancelled = true;
    };
  }, [project, otherEntries]);

  useEffect(() => {
    const unlisten = listenForPreviewReady(() => {
      const current = latestDescriptorResult.current;
      if (current.status === "ok") {
        void pushDescriptorToPreviewWindow(current.descriptor);
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
