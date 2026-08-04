import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../../i18n";
import { createNewProject } from "../../../domain/model";
import { useProjectStore } from "../../../state";
import { RightPanel } from "./RightPanel";

vi.mock("@tauri-apps/plugin-dialog", () => ({ save: vi.fn() }));

const openOrFocusA3PreviewWindow = vi.fn();
const pushDescriptorToPreviewWindow = vi.fn();
let capturedReadyCallback: (() => void) | undefined;
const listenForPreviewReady = vi.fn((callback: () => void) => {
  capturedReadyCallback = callback;
  return Promise.resolve(vi.fn());
});

vi.mock("../a3PreviewWindow/window", () => ({
  openOrFocusA3PreviewWindow: (...args: unknown[]) => openOrFocusA3PreviewWindow(...args),
  pushDescriptorToPreviewWindow: (...args: unknown[]) => pushDescriptorToPreviewWindow(...args),
  listenForPreviewReady: (...args: [() => void]) => listenForPreviewReady(...args),
}));

const initialStoreState = useProjectStore.getState();

function renderRightPanel() {
  const { project } = createNewProject({ title: "T", language: "en", appVersion: "0.1.0" });
  useProjectStore.setState({ ...initialStoreState, project });
  return render(<RightPanel />);
}

/**
 * D-131 (the in-panel widen/narrow toggle) is superseded by this — see
 * DECISIONS.md. Found walking the real app: even `w-[70vw]` still could not
 * show a real A3 sheet at a readable size, so Barış asked for a real pop-out
 * OS window with its own zoom/pan/fit controls (`a3PreviewWindow/`) instead.
 */
describe("RightPanel — pop-out preview window", () => {
  it("opens (or focuses) the preview window on click", async () => {
    const user = userEvent.setup();
    renderRightPanel();

    await user.click(screen.getByRole("button", { name: "Open in new window" }));

    expect(openOrFocusA3PreviewWindow).toHaveBeenCalledOnce();
  });

  it("pushes the built descriptor to the preview window once it resolves", async () => {
    renderRightPanel();

    await waitFor(() => expect(pushDescriptorToPreviewWindow).toHaveBeenCalled());
  });

  /**
   * The race D-129-adjacent handshake exists to close: the preview window
   * announces readiness (possibly after the main window already finished
   * building), and the main window must respond with whatever it currently
   * has rather than only pushing on the *next* edit.
   */
  it("re-pushes the current descriptor when the preview window announces it is ready", async () => {
    renderRightPanel();
    await waitFor(() => expect(pushDescriptorToPreviewWindow).toHaveBeenCalled());
    pushDescriptorToPreviewWindow.mockClear();

    capturedReadyCallback?.();

    await waitFor(() => expect(pushDescriptorToPreviewWindow).toHaveBeenCalledOnce());
  });

  it("still offers the pre-existing collapse toggle, unaffected", async () => {
    const user = userEvent.setup();
    renderRightPanel();

    await user.click(screen.getByRole("button", { name: "Collapse panel" }));

    expect(screen.getByRole("button", { name: "Expand panel" })).toBeTruthy();
  });
});
