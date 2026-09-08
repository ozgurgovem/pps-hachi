import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { invoke } from "@tauri-apps/api/core";
import "../../../i18n";
import { createNewProject } from "../../../domain/model";
import { findOrphanedReferences } from "../../../domain/selectors";
import { useProjectStore } from "../../../state";
import { WorkspaceScreen } from "./WorkspaceScreen";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({
    onCloseRequested: vi.fn().mockResolvedValue(() => {}),
    destroy: vi.fn(),
  }),
}));

const mockInvoke = vi.mocked(invoke);
const initialStoreState = useProjectStore.getState();

/**
 * D-116/D-117 end to end through the real workspace: the picker is generic
 * shell UI driven by a plugin *declaration*, so the seam that can silently
 * break is dialog → command → store, which no plugin's own test covers.
 */
function renderWorkspace() {
  const { manifest, project } = createNewProject({ title: "Şişli Hattı", language: "en", appVersion: "0.1.0" });
  const outcome = {
    kind: "opened" as const,
    manifest,
    project,
    path: "/tmp/test.ppsx",
    otherEntries: [],
    modifiedMs: 1000,
    readOnly: false,
  };

  return render(
    <MemoryRouter initialEntries={[{ pathname: "/project", state: outcome }]}>
      <Routes>
        <Route path="/project" element={<WorkspaceScreen />} />
      </Routes>
    </MemoryRouter>,
  );
}

async function goToStep(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole("button", { name: new RegExp(name) }));
}

async function addEntry(user: ReturnType<typeof userEvent.setup>, methodName: string, title: string) {
  const methodBand = screen.getByRole("heading", { name: "Add an entry" }).closest("section");
  // D-169/C6: a method with no `tier: "recommended"` (e.g. hypothesisVerification)
  // lives in the collapsed "Other methods" disclosure — expand it first if
  // it isn't already (idempotent, mirrors WorkspaceScreen.test.tsx's fix).
  const otherToggle = within(methodBand!).queryByRole("button", { name: /other formats/i });
  if (otherToggle?.getAttribute("aria-expanded") === "false") {
    await user.click(otherToggle);
  }
  const card = within(methodBand!).getByText(methodName).closest("div");
  await user.click(within(card!).getByRole("button", { name: "Add entry" }));
  const panel = await screen.findByRole("group", { name: "New entry" });
  await user.type(within(panel).getByLabelText("Title"), title);
  return panel;
}

async function saveDialog(user: ReturnType<typeof userEvent.setup>, panel: HTMLElement) {
  await user.click(within(panel).getByRole("button", { name: "Save" }));
  await waitFor(() => expect(screen.queryByRole("group", { name: "New entry" })).toBeFalsy());
}

beforeEach(() => {
  useProjectStore.setState(initialStoreState, true);
  mockInvoke.mockImplementation((command: string) => {
    switch (command) {
      case "ppsx_write":
        return Promise.resolve({ modifiedMs: Date.now() });
      case "history_list":
      case "recent_upsert":
      case "recent_list":
        return Promise.resolve([]);
      default:
        return Promise.resolve(null);
    }
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("cross-step references in the workspace", () => {
  test("a countermeasure created in Step 5 stores a link to a Step 4 root cause", async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await goToStep(user, "Root Cause Analysis");
    const rootCauseDialog = await addEntry(user, "Hypothesis verification table", "Die wear confirmed");
    await saveDialog(user, rootCauseDialog);

    await goToStep(user, "Develop Countermeasures");
    const cmDialog = await addEntry(user, "Countermeasure", "Fit presence sensor");
    await user.click(within(cmDialog).getByRole("button", { name: /Die wear confirmed/ }));
    await saveDialog(user, cmDialog);

    const project = useProjectStore.getState().project!;
    const rootCauseId = project.steps[4].entries[0]!.id;
    expect(project.steps[5].entries[0]?.references).toEqual([
      { role: "rootCause", targetEntryId: rootCauseId },
    ]);
    expect(findOrphanedReferences(project)).toEqual([]);
  });

  test("an entry from a method with no reference roles stores no references key", async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await goToStep(user, "Root Cause Analysis");
    const dialog = await addEntry(user, "Why-Why logic tree", "Why the press stopped");
    await saveDialog(user, dialog);

    const entry = useProjectStore.getState().project!.steps[4].entries[0]!;
    expect("references" in entry).toBe(false);
  });

  /** D-117: the delete is permitted, the referrer is untouched, undo resolves it again. */
  test("deleting the target leaves a dangling reference that undo restores", async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await goToStep(user, "Root Cause Analysis");
    const rootCauseDialog = await addEntry(user, "Hypothesis verification table", "Die wear confirmed");
    await saveDialog(user, rootCauseDialog);

    await goToStep(user, "Develop Countermeasures");
    const cmDialog = await addEntry(user, "Countermeasure", "Fit presence sensor");
    await user.click(within(cmDialog).getByRole("button", { name: /Die wear confirmed/ }));
    await saveDialog(user, cmDialog);

    await goToStep(user, "Root Cause Analysis");
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeFalsy());

    const afterDelete = useProjectStore.getState().project!;
    expect(afterDelete.steps[5].entries[0]?.references).toHaveLength(1);
    expect(findOrphanedReferences(afterDelete)).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "Undo" }));

    await waitFor(() => {
      expect(findOrphanedReferences(useProjectStore.getState().project!)).toEqual([]);
    });
  });
});
