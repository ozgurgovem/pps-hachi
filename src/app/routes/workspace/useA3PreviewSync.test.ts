import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createNewProject } from "../../../domain/model";
import { useProjectStore } from "../../../state";
import { useA3PreviewSync } from "./useA3PreviewSync";

const pushDescriptorToPreviewWindow = vi.fn();
let capturedReadyCallback: (() => void) | undefined;
const listenForPreviewReady = vi.fn((callback: () => void) => {
  capturedReadyCallback = callback;
  return Promise.resolve(vi.fn());
});
interface BlockPinRequest {
  readonly stepId: number;
  readonly canvasRows?: number;
}
let capturedPinRequestCallback: ((request: BlockPinRequest) => void) | undefined;
const listenForBlockPinRequest = vi.fn((callback: (request: BlockPinRequest) => void) => {
  capturedPinRequestCallback = callback;
  return Promise.resolve(vi.fn());
});

vi.mock("../a3PreviewWindow/window", () => ({
  pushDescriptorToPreviewWindow: (...args: unknown[]) => pushDescriptorToPreviewWindow(...args),
  listenForPreviewReady: (...args: [() => void]) => listenForPreviewReady(...args),
  listenForBlockPinRequest: (...args: [(request: BlockPinRequest) => void]) => listenForBlockPinRequest(...args),
}));

const initialStoreState = useProjectStore.getState();

function seed() {
  const { project } = createNewProject({ title: "T", language: "en", appVersion: "0.1.0" });
  useProjectStore.setState({ ...initialStoreState, project });
}

/**
 * D-129-adjacent handshake + Faz 11/L3b pin forwarding, extracted verbatim
 * out of the now-deleted `RightPanel` (D-217/W2) — same coverage, new home.
 */
describe("useA3PreviewSync", () => {
  it("pushes the built descriptor to the preview window once it resolves", async () => {
    seed();
    renderHook(() => useA3PreviewSync());

    await waitFor(() => expect(pushDescriptorToPreviewWindow).toHaveBeenCalled());
  });

  it("re-pushes the current descriptor when the preview window announces it is ready", async () => {
    seed();
    renderHook(() => useA3PreviewSync());
    await waitFor(() => expect(pushDescriptorToPreviewWindow).toHaveBeenCalled());
    pushDescriptorToPreviewWindow.mockClear();

    capturedReadyCallback?.();

    await waitFor(() => expect(pushDescriptorToPreviewWindow).toHaveBeenCalledOnce());
  });

  it("returns an ok descriptor result once the build resolves", async () => {
    seed();
    const { result } = renderHook(() => useA3PreviewSync());

    await waitFor(() => expect(result.current.status).toBe("ok"));
  });

  it("a pin request forwarded from the pop-out preview window sets the pin on the real project", async () => {
    seed();
    renderHook(() => useA3PreviewSync());
    await waitFor(() => expect(listenForBlockPinRequest).toHaveBeenCalled());

    capturedPinRequestCallback?.({ stepId: 2, canvasRows: 25 });

    await waitFor(() => expect(useProjectStore.getState().project?.blockPins).toEqual({ 2: 25 }));
  });

  it("a pin request with no canvasRows clears that block's pin, mirroring 'reset to automatic'", async () => {
    const { project } = createNewProject({ title: "T", language: "en", appVersion: "0.1.0" });
    useProjectStore.setState({ ...initialStoreState, project: { ...project, blockPins: { 2: 30 } } });
    renderHook(() => useA3PreviewSync());
    await waitFor(() => expect(listenForBlockPinRequest).toHaveBeenCalled());

    capturedPinRequestCallback?.({ stepId: 2 });

    await waitFor(() => expect(useProjectStore.getState().project?.blockPins).toEqual({}));
  });
});
