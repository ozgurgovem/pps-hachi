import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { invoke } from "@tauri-apps/api/core";
import "../../../i18n";
import { createNewProject, STEP_IDS } from "../../../domain/model";
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

function renderWorkspace(overrides: { readOnly?: boolean } = {}) {
  const { manifest, project } = createNewProject({ title: "Şişli Hattı", language: "en", appVersion: "0.1.0" });
  const outcome = {
    kind: "opened" as const,
    manifest,
    project,
    path: "/tmp/test.ppsx",
    otherEntries: [],
    modifiedMs: 1000,
    readOnly: overrides.readOnly ?? false,
  };

  return render(
    <MemoryRouter initialEntries={[{ pathname: "/project", state: outcome }]}>
      <Routes>
        <Route path="/project" element={<WorkspaceScreen />} />
      </Routes>
    </MemoryRouter>,
  );
}

async function addGenericTextEntry(user: ReturnType<typeof userEvent.setup>, title: string) {
  // Phase 5 gave some steps a second method card (e.g. Pareto on step 2),
  // each with its own identically-labeled "Add entry" button per CLAUDE.md's
  // "same action keeps the same name" copy rule, and EntryRow also renders a
  // plugin's display name as a per-entry label — scope to the method band's
  // own section, then to the Free text card within it, so this stays
  // unambiguous regardless of how many methods or entries already exist.
  const methodBand = screen.getByRole("heading", { name: "Add an entry" }).closest("section");
  // D-169/C6: `genericText` never gets a `tier`, so "Free text" always lives
  // in the collapsed "Other methods" disclosure — expand it first if it
  // isn't already (idempotent: a later call in the same step finds it open).
  const otherToggle = within(methodBand!).queryByRole("button", { name: /other formats/i });
  if (otherToggle?.getAttribute("aria-expanded") === "false") {
    await user.click(otherToggle);
  }
  const freeTextCard = within(methodBand!).getByText("Free text").closest("div");
  await user.click(within(freeTextCard!).getByRole("button", { name: "Add entry" }));
  const panel = await screen.findByRole("group", { name: "New entry" });
  await user.type(within(panel).getByLabelText("Title"), title);
  await user.type(within(panel).getByLabelText("Text"), `${title} body`);
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
        return Promise.resolve(undefined);
    }
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("WorkspaceScreen — Phase 3 done-condition", () => {
  test("the user can create and reorder generic-text entries in every one of the 8 steps", async () => {
    const user = userEvent.setup();
    renderWorkspace();

    expect(await screen.findByRole("heading", { name: "Şişli Hattı" })).toBeTruthy();

    for (const stepId of STEP_IDS) {
      await user.click(screen.getByRole("button", { name: new RegExp(`^Step ${stepId}:`) }));
      await addGenericTextEntry(user, `Step ${stepId} note A`);
      await addGenericTextEntry(user, `Step ${stepId} note B`);
      // Phase 4's live A3 preview (RightPanel) can render the same entry
      // title again — scope to the entries band so this stays a query about
      // EntriesBand, not about the preview.
      const main = within(screen.getByRole("main"));
      expect(main.getByText(`Step ${stepId} note A`)).toBeTruthy();
      expect(main.getByText(`Step ${stepId} note B`)).toBeTruthy();
    }
  });

  test("reordering an entry with the move-down/move-up controls changes its position", async () => {
    const user = userEvent.setup();
    renderWorkspace();
    await user.click(screen.getByRole("button", { name: /^Step 4:/ }));
    await addGenericTextEntry(user, "First entry");
    await addGenericTextEntry(user, "Second entry");

    const main = within(screen.getByRole("main"));
    const entriesBefore = main.getAllByText(/^(First|Second) entry$/).map((el) => el.textContent);
    expect(entriesBefore).toEqual(["First entry", "Second entry"]);

    const [firstMoveDown] = screen.getAllByRole("button", { name: "Move down" });
    if (!firstMoveDown) throw new Error("expected at least one Move down button");
    await user.click(firstMoveDown);

    const entriesAfter = main.getAllByText(/^(First|Second) entry$/).map((el) => el.textContent);
    expect(entriesAfter).toEqual(["Second entry", "First entry"]);
  });

  test("editing an entry's text updates it live and undo reverts the change", async () => {
    const user = userEvent.setup();
    renderWorkspace();
    await user.click(screen.getByRole("button", { name: /^Step 2:/ }));
    await addGenericTextEntry(user, "Editable entry");

    await user.click(screen.getByRole("button", { name: "Edit" }));
    const panel = await screen.findByRole("group", { name: "Edit entry" });
    await user.type(within(panel).getByLabelText("Text"), " — extra detail");
    await user.click(within(panel).getByRole("button", { name: "Close" }));

    expect(useProjectStore.getState().project?.steps[2].entries[0]?.payload).toMatchObject({
      text: "Editable entry body — extra detail",
    });

    await user.click(screen.getByRole("button", { name: "Undo" }));

    expect(useProjectStore.getState().project?.steps[2].entries[0]?.payload).toMatchObject({
      text: "Editable entry body",
    });
  });

  test("deleting an entry asks for confirmation before removing it", async () => {
    const user = userEvent.setup();
    renderWorkspace();
    await user.click(screen.getByRole("button", { name: /^Step 5:/ }));
    await addGenericTextEntry(user, "Entry to delete");

    await user.click(screen.getByRole("button", { name: "Delete" }));
    const confirmDialog = await screen.findByRole("dialog");
    expect(within(confirmDialog).getByText(/will be removed from this step/)).toBeTruthy();
    await user.click(within(confirmDialog).getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(screen.queryByText("Entry to delete")).toBeFalsy());
  });

  test("an unknown methodId entry renders as a restricted read-only placeholder (P-05)", async () => {
    const { manifest, project } = createNewProject({ title: "Legacy project", language: "en", appVersion: "0.1.0" });
    const withUnknownEntry = {
      ...project,
      steps: {
        ...project.steps,
        3: {
          entries: [
            {
              id: "unknown-1",
              methodId: "future-method-from-a-later-version",
              title: "A future method entry",
              order: 0,
              a3Visibility: "primary" as const,
              payload: { anything: "opaque" },
              images: [],
              createdAt: "2026-08-02T00:00:00.000Z",
              updatedAt: "2026-08-02T00:00:00.000Z",
              provenance: { origin: "human" as const },
            },
          ],
        },
      },
    };
    const outcome = {
      kind: "opened" as const,
      manifest,
      project: withUnknownEntry,
      path: "/tmp/legacy.ppsx",
      otherEntries: [],
      modifiedMs: 1000,
      readOnly: false,
    };
    render(
      <MemoryRouter initialEntries={[{ pathname: "/project", state: outcome }]}>
        <Routes>
          <Route path="/project" element={<WorkspaceScreen />} />
        </Routes>
      </MemoryRouter>,
    );
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: /^Step 3:/ }));

    expect(await screen.findByText("Unknown method")).toBeTruthy();
    expect(within(screen.getByRole("main")).getByText("A future method entry")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Edit" })).toBeFalsy();
    expect(screen.getByRole("button", { name: "Delete" })).toBeTruthy();
  });

  test("a read-only project never shows the add-entry action and shows the read-only banner", async () => {
    const user = userEvent.setup();
    renderWorkspace({ readOnly: true });

    expect(await screen.findByText(/newer version of PPS Hachi/)).toBeTruthy();
    // W1/D-218: the landing view has no method band at all — navigate into
    // a step first (read-only never blocks navigation, only editing).
    await user.click(await screen.findByRole("button", { name: /^Step 1:/ }));
    // Step 1 now offers more than one method card (Phase 5) — every "Add
    // entry" button on the page must be disabled, not just the first one.
    const addEntryButtons = screen.getAllByRole("button", { name: "Add entry" }) as HTMLButtonElement[];
    expect(addEntryButtons.length).toBeGreaterThan(0);
    expect(addEntryButtons.every((button) => button.disabled)).toBe(true);
  });
});
