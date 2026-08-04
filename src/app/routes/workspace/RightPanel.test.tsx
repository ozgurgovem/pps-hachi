import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../../i18n";
import { createNewProject } from "../../../domain/model";
import { useProjectStore } from "../../../state";
import { RightPanel } from "./RightPanel";

vi.mock("@tauri-apps/plugin-dialog", () => ({ save: vi.fn() }));

const initialStoreState = useProjectStore.getState();

function renderRightPanel() {
  const { project } = createNewProject({ title: "T", language: "en", appVersion: "0.1.0" });
  useProjectStore.setState({ ...initialStoreState, project });
  return render(<RightPanel />);
}

/**
 * Found walking the real app (Anayasa §3b): the fixed 320px panel cannot
 * show a real A3 sheet at a size a human can read. This is the widen/narrow
 * toggle added to fix it — orthogonal to the pre-existing collapse toggle.
 */
describe("RightPanel widen toggle", () => {
  it("starts narrow at the pre-existing fixed width", () => {
    renderRightPanel();

    expect(screen.getByRole("button", { name: "Widen preview" })).toBeTruthy();
    expect(screen.getByRole("complementary").className).toMatch(/w-80/);
  });

  it("widens on click and offers to narrow back", async () => {
    const user = userEvent.setup();
    renderRightPanel();

    await user.click(screen.getByRole("button", { name: "Widen preview" }));

    expect(screen.getByRole("button", { name: "Narrow preview" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Widen preview" })).toBeNull();
    expect(screen.getByRole("complementary").className).toMatch(/w-\[70vw\]/);
  });

  it("narrows back on a second click", async () => {
    const user = userEvent.setup();
    renderRightPanel();

    await user.click(screen.getByRole("button", { name: "Widen preview" }));
    await user.click(screen.getByRole("button", { name: "Narrow preview" }));

    expect(screen.getByRole("button", { name: "Widen preview" })).toBeTruthy();
  });

  it("does not fight the pre-existing collapse toggle", async () => {
    const user = userEvent.setup();
    renderRightPanel();

    await user.click(screen.getByRole("button", { name: "Widen preview" }));
    await user.click(screen.getByRole("button", { name: "Collapse panel" }));

    expect(screen.getByRole("button", { name: "Expand panel" })).toBeTruthy();
  });
});
