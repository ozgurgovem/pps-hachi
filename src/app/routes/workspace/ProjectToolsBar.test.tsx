import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../../i18n";
import type { A3LayoutDescriptor } from "../../../a3/descriptor";
import { createNewProject } from "../../../domain/model";
import { useProjectStore } from "../../../state";
import { ProjectToolsBar } from "./ProjectToolsBar";
import type { DescriptorResult } from "./useA3PreviewSync";

vi.mock("@tauri-apps/plugin-dialog", () => ({ save: vi.fn() }));
vi.mock("../a3PreviewWindow/window", () => ({
  openOrFocusA3PreviewWindow: vi.fn(),
  pushDescriptorToPreviewWindow: vi.fn(),
  listenForPreviewReady: vi.fn(() => Promise.resolve(vi.fn())),
  listenForBlockPinRequest: vi.fn(() => Promise.resolve(vi.fn())),
}));

const FAKE_DESCRIPTOR = {} as A3LayoutDescriptor;
const OK_RESULT: DescriptorResult = { status: "ok", descriptor: FAKE_DESCRIPTOR };
const LOADING_RESULT: DescriptorResult = { status: "loading" };

const initialStoreState = useProjectStore.getState();

function renderBar(aiEnabled = false, descriptorResult: DescriptorResult = OK_RESULT) {
  const { project } = createNewProject({ title: "T", language: "en", appVersion: "0.1.0" });
  useProjectStore.setState({
    ...initialStoreState,
    project: { ...project, meta: { ...project.meta, ai: { ...project.meta.ai, enabled: aiEnabled } } },
  });
  return render(<ProjectToolsBar descriptorResult={descriptorResult} />);
}

afterEach(() => {
  vi.clearAllMocks();
  useProjectStore.setState(initialStoreState, true);
});

/**
 * W2/D-217: `RightPanel`'s four whole-project tabs, minus Preview and
 * Assistant (moved elsewhere this dilim) — same components, same
 * `aiEnabled` gating, now opened as dialogs from the top bar instead of
 * tabs from a removed sidebar.
 */
describe("ProjectToolsBar", () => {
  it("always shows Traceability, even with AI off — it needs no model", () => {
    renderBar(false);

    expect(screen.getByRole("button", { name: "Traceability" })).toBeTruthy();
  });

  it("hides Review/Audit/Translate when AI is off", () => {
    renderBar(false);

    expect(screen.queryByRole("button", { name: "Review" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Audit" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Translate" })).toBeNull();
  });

  it("shows Review/Audit/Translate once AI is enabled", () => {
    renderBar(true);

    expect(screen.getByRole("button", { name: "Review" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Audit" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Translate" })).toBeTruthy();
  });

  it("opens Traceability in a dialog on click", async () => {
    const user = userEvent.setup();
    renderBar(false);

    await user.click(screen.getByRole("button", { name: "Traceability" }));

    expect(await screen.findByRole("dialog")).toBeTruthy();
  });

  it("closing the dialog removes it", async () => {
    const user = userEvent.setup();
    renderBar(false);

    await user.click(screen.getByRole("button", { name: "Traceability" }));
    const dialog = await screen.findByRole("dialog");
    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeFalsy());
    expect(dialog).toBeTruthy();
  });

  it("Export is disabled while the descriptor is still loading", () => {
    renderBar(false, LOADING_RESULT);

    const exportButton = screen.getByRole("button", { name: "Export A3" });
    expect(exportButton).toHaveProperty("disabled", true);
  });

  it("Export is enabled once the descriptor has built (status ok)", () => {
    renderBar(false, OK_RESULT);

    const exportButton = screen.getByRole("button", { name: "Export A3" });
    expect(exportButton).toHaveProperty("disabled", false);
  });
});
