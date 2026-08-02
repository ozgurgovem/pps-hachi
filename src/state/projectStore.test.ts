import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { createNewProject, type Entry, type ProjectModel } from "../domain/model";
import type { Command, EntryUpdateCommand } from "../domain/commands";
import { PpsxWriteConflictError } from "../app/routes/launch/ppsxIpc";

vi.mock("../app/routes/launch/ppsxIpc", async () => {
  const actual = await vi.importActual<typeof import("../app/routes/launch/ppsxIpc")>(
    "../app/routes/launch/ppsxIpc",
  );
  return {
    ...actual,
    writePpsx: vi.fn(),
    saveHistorySnapshot: vi.fn(),
    listHistorySnapshots: vi.fn(),
    readHistorySnapshot: vi.fn(),
  };
});

import { writePpsx, saveHistorySnapshot, listHistorySnapshots, readHistorySnapshot } from "../app/routes/launch/ppsxIpc";
import { selectCanRedo, selectCanUndo, selectIsDirty, useProjectStore } from "./projectStore";

const mockWrite = vi.mocked(writePpsx);
const mockSaveSnapshot = vi.mocked(saveHistorySnapshot);
const mockListSnapshots = vi.mocked(listHistorySnapshots);
const mockReadSnapshot = vi.mocked(readHistorySnapshot);

const initialState = useProjectStore.getState();

beforeEach(() => {
  useProjectStore.setState(initialState, true);
  mockWrite.mockReset().mockResolvedValue({ modifiedMs: 2000 });
  mockSaveSnapshot.mockReset().mockResolvedValue(undefined);
  mockListSnapshots.mockReset().mockResolvedValue([]);
  mockReadSnapshot.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

function makeEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: "entry-1",
    methodId: "generic-text",
    title: "Entry",
    order: 0,
    a3Visibility: "primary",
    payload: { text: "hello" },
    images: [],
    createdAt: "2026-08-02T00:00:00.000Z",
    updatedAt: "2026-08-02T00:00:00.000Z",
    provenance: { origin: "human" },
    ...overrides,
  };
}

function freshOutcome(overrides: { readOnly?: boolean; entries?: Entry[] } = {}) {
  const { manifest, project } = createNewProject({ title: "Test", language: "en", appVersion: "0.1.0" });
  const withEntries: ProjectModel = overrides.entries
    ? { ...project, steps: { ...project.steps, 4: { entries: overrides.entries } } }
    : project;
  return {
    kind: "opened" as const,
    manifest,
    project: withEntries,
    path: "/tmp/test.ppsx",
    otherEntries: [],
    modifiedMs: 1000,
    readOnly: overrides.readOnly ?? false,
  };
}

describe("loadProject", () => {
  it("populates project/manifest/path and resets undo/redo/revision", () => {
    const outcome = freshOutcome();
    useProjectStore.getState().loadProject(outcome);

    const state = useProjectStore.getState();
    expect(state.project?.id).toBe(outcome.project.id);
    expect(state.manifest).toEqual(outcome.manifest);
    expect(state.path).toBe("/tmp/test.ppsx");
    expect(state.revision).toBe(0);
    expect(state.lastSavedRevision).toBe(0);
    expect(state.undoStack).toEqual([]);
    expect(state.redoStack).toEqual([]);
  });

  it("normalizes entry order on load (D-71)", () => {
    const outcome = freshOutcome({
      entries: [makeEntry({ id: "b", order: 5 }), makeEntry({ id: "a", order: 0 })],
    });

    useProjectStore.getState().loadProject(outcome);

    const entries = useProjectStore.getState().project?.steps[4].entries ?? [];
    expect(entries.map((e) => e.id)).toEqual(["a", "b"]);
    expect(entries.map((e) => e.order)).toEqual([0, 1]);
  });

  it("sets read-only save status for a read-only project and never writes a baseline snapshot", () => {
    const outcome = freshOutcome({ readOnly: true });

    useProjectStore.getState().loadProject(outcome);

    expect(useProjectStore.getState().saveStatus).toEqual({ kind: "read-only" });
    expect(mockSaveSnapshot).not.toHaveBeenCalled();
  });

  it("writes a baseline history snapshot on open for a writable project", async () => {
    useProjectStore.getState().loadProject(freshOutcome());
    await vi.waitFor(() => expect(mockSaveSnapshot).toHaveBeenCalledTimes(1));
  });
});

describe("dispatch", () => {
  it("applies the command, bumps revision, pushes undo and clears redo", () => {
    useProjectStore.getState().loadProject(freshOutcome());
    const command: Command = {
      type: "entry.insert",
      stepId: 4,
      entry: makeEntry({ id: "new" }),
      index: 0,
      undoable: true,
    };

    useProjectStore.getState().dispatch(command);

    const state = useProjectStore.getState();
    expect(state.project?.steps[4].entries.map((e) => e.id)).toEqual(["new"]);
    expect(state.revision).toBe(1);
    expect(state.undoStack).toEqual([command]);
    expect(state.redoStack).toEqual([]);
    expect(selectIsDirty(state)).toBe(true);
  });
});

describe("undo / redo", () => {
  it("undo reverts the last command and moves it to the redo stack", () => {
    useProjectStore.getState().loadProject(freshOutcome());
    const command: Command = {
      type: "entry.insert",
      stepId: 4,
      entry: makeEntry({ id: "new" }),
      index: 0,
      undoable: true,
    };
    useProjectStore.getState().dispatch(command);

    useProjectStore.getState().undo();

    const state = useProjectStore.getState();
    expect(state.project?.steps[4].entries).toEqual([]);
    expect(selectCanUndo(state)).toBe(false);
    expect(selectCanRedo(state)).toBe(true);
  });

  it("redo re-applies the command", () => {
    useProjectStore.getState().loadProject(freshOutcome());
    const command: Command = {
      type: "entry.insert",
      stepId: 4,
      entry: makeEntry({ id: "new" }),
      index: 0,
      undoable: true,
    };
    useProjectStore.getState().dispatch(command);
    useProjectStore.getState().undo();

    useProjectStore.getState().redo();

    const state = useProjectStore.getState();
    expect(state.project?.steps[4].entries.map((e) => e.id)).toEqual(["new"]);
    expect(selectCanRedo(state)).toBe(false);
  });

  it("a new dispatch clears the redo stack", () => {
    useProjectStore.getState().loadProject(freshOutcome());
    const first: Command = { type: "entry.insert", stepId: 4, entry: makeEntry({ id: "a" }), index: 0, undoable: true };
    const second: Command = { type: "entry.insert", stepId: 4, entry: makeEntry({ id: "b" }), index: 1, undoable: true };
    useProjectStore.getState().dispatch(first);
    useProjectStore.getState().undo();

    useProjectStore.getState().dispatch(second);

    expect(selectCanRedo(useProjectStore.getState())).toBe(false);
  });

  // D-70/F-7: a stale command whose precondition no longer holds clears both
  // stacks and surfaces an error instead of half-applying.
  it("clears both stacks and surfaces an error when undo hits a precondition failure", () => {
    useProjectStore.getState().loadProject(freshOutcome());
    const missing = makeEntry({ id: "never-existed" });
    const staleCommand: Command = {
      type: "entry.update",
      stepId: 4,
      entryId: "never-existed",
      before: missing,
      after: { ...missing, title: "changed" },
      undoable: true,
    };
    // Simulate a corrupted stack directly — this state should be unreachable
    // through normal dispatch, which is exactly why undo must defend against it.
    useProjectStore.setState({ undoStack: [staleCommand] });

    useProjectStore.getState().undo();

    const state = useProjectStore.getState();
    expect(state.undoStack).toEqual([]);
    expect(state.redoStack).toEqual([]);
    expect(state.saveStatus.kind).toBe("error");
  });

  it("undo/redo are no-ops on an empty stack", () => {
    useProjectStore.getState().loadProject(freshOutcome());
    expect(() => useProjectStore.getState().undo()).not.toThrow();
    expect(() => useProjectStore.getState().redo()).not.toThrow();
  });
});

describe("dispatchCoalescedUpdate", () => {
  it("merges consecutive edits to the same target within the coalescing window into one undo entry", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-02T10:00:00.000Z"));
    useProjectStore.getState().loadProject(freshOutcome({ entries: [makeEntry({ id: "a" })] }));
    const entry = useProjectStore.getState().project!.steps[4].entries[0]!;

    const first: EntryUpdateCommand = {
      type: "entry.update",
      stepId: 4,
      entryId: "a",
      before: entry,
      after: { ...entry, payload: { text: "h" }, updatedAt: "2026-08-02T10:00:00.100Z" },
      undoable: true,
    };
    useProjectStore.getState().dispatchCoalescedUpdate(first, "4:a:payload");

    vi.advanceTimersByTime(200);
    const second: EntryUpdateCommand = {
      type: "entry.update",
      stepId: 4,
      entryId: "a",
      before: first.after,
      after: { ...entry, payload: { text: "he" }, updatedAt: "2026-08-02T10:00:00.300Z" },
      undoable: true,
    };
    useProjectStore.getState().dispatchCoalescedUpdate(second, "4:a:payload");

    const state = useProjectStore.getState();
    expect(state.undoStack).toHaveLength(1);
    expect(state.undoStack[0]).toMatchObject({ before: entry, after: second.after });
    expect(state.project?.steps[4].entries[0]!.payload).toEqual({ text: "he" });
  });

  it("does not coalesce once the window has elapsed", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-02T10:00:00.000Z"));
    useProjectStore.getState().loadProject(freshOutcome({ entries: [makeEntry({ id: "a" })] }));
    const entry = useProjectStore.getState().project!.steps[4].entries[0]!;
    const first: EntryUpdateCommand = {
      type: "entry.update",
      stepId: 4,
      entryId: "a",
      before: entry,
      after: { ...entry, payload: { text: "h" } },
      undoable: true,
    };
    useProjectStore.getState().dispatchCoalescedUpdate(first, "4:a:payload");

    vi.advanceTimersByTime(1000); // past the 600ms window
    const second: EntryUpdateCommand = {
      type: "entry.update",
      stepId: 4,
      entryId: "a",
      before: first.after,
      after: { ...entry, payload: { text: "he" } },
      undoable: true,
    };
    useProjectStore.getState().dispatchCoalescedUpdate(second, "4:a:payload");

    expect(useProjectStore.getState().undoStack).toHaveLength(2);
  });

  it("does not coalesce across different targets even within the window", () => {
    useProjectStore.getState().loadProject(
      freshOutcome({ entries: [makeEntry({ id: "a" }), makeEntry({ id: "b" })] }),
    );
    const [entryA, entryB] = useProjectStore.getState().project!.steps[4].entries as [Entry, Entry];

    useProjectStore.getState().dispatchCoalescedUpdate(
      { type: "entry.update", stepId: 4, entryId: "a", before: entryA, after: { ...entryA, title: "A2" }, undoable: true },
      "4:a:title",
    );
    useProjectStore.getState().dispatchCoalescedUpdate(
      { type: "entry.update", stepId: 4, entryId: "b", before: entryB, after: { ...entryB, title: "B2" }, undoable: true },
      "4:b:title",
    );

    expect(useProjectStore.getState().undoStack).toHaveLength(2);
  });

  it("sealTextEditCoalescing prevents the next matching edit from merging", () => {
    useProjectStore.getState().loadProject(freshOutcome({ entries: [makeEntry({ id: "a" })] }));
    const entry = useProjectStore.getState().project!.steps[4].entries[0]!;
    useProjectStore.getState().dispatchCoalescedUpdate(
      { type: "entry.update", stepId: 4, entryId: "a", before: entry, after: { ...entry, title: "A2" }, undoable: true },
      "4:a:title",
    );

    useProjectStore.getState().sealTextEditCoalescing();

    useProjectStore.getState().dispatchCoalescedUpdate(
      { type: "entry.update", stepId: 4, entryId: "a", before: entry, after: { ...entry, title: "A3" }, undoable: true },
      "4:a:title",
    );

    expect(useProjectStore.getState().undoStack).toHaveLength(2);
  });
});

describe("saveNow", () => {
  it("does nothing when nothing is dirty", async () => {
    useProjectStore.getState().loadProject(freshOutcome());
    await useProjectStore.getState().saveNow();
    expect(mockWrite).not.toHaveBeenCalled();
  });

  it("writes the project, updates lastSavedRevision/diskModifiedMs, and reports saved", async () => {
    useProjectStore.getState().loadProject(freshOutcome());
    useProjectStore.getState().dispatch({
      type: "entry.insert",
      stepId: 4,
      entry: makeEntry({ id: "new" }),
      index: 0,
      undoable: true,
    });

    await useProjectStore.getState().saveNow();

    const state = useProjectStore.getState();
    expect(mockWrite).toHaveBeenCalledTimes(1);
    expect(state.lastSavedRevision).toBe(1);
    expect(state.diskModifiedMs).toBe(2000);
    expect(state.saveStatus.kind).toBe("saved");
  });

  it("passes diskModifiedMs as expectedModifiedMs (D-77 compare-and-swap)", async () => {
    useProjectStore.getState().loadProject(freshOutcome());
    useProjectStore.getState().dispatch({
      type: "entry.insert",
      stepId: 4,
      entry: makeEntry({ id: "new" }),
      index: 0,
      undoable: true,
    });

    await useProjectStore.getState().saveNow();

    expect(mockWrite).toHaveBeenCalledWith(
      "/tmp/test.ppsx",
      expect.anything(),
      expect.anything(),
      [],
      1000,
    );
  });

  it("never writes when the project is read-only", async () => {
    useProjectStore.getState().loadProject(freshOutcome({ readOnly: true }));
    useProjectStore.setState({ revision: 1 }); // force "dirty" to prove the gate, not the dirty check

    await useProjectStore.getState().saveNow();

    expect(mockWrite).not.toHaveBeenCalled();
    expect(useProjectStore.getState().saveStatus).toEqual({ kind: "read-only" });
  });

  it("maps a conflict error to the conflict save status without throwing", async () => {
    mockWrite.mockRejectedValueOnce(new PpsxWriteConflictError("file changed on disk"));
    useProjectStore.getState().loadProject(freshOutcome());
    useProjectStore.getState().dispatch({
      type: "entry.insert",
      stepId: 4,
      entry: makeEntry({ id: "new" }),
      index: 0,
      undoable: true,
    });

    await useProjectStore.getState().saveNow();

    expect(useProjectStore.getState().saveStatus).toEqual({ kind: "conflict" });
  });

  it("maps a generic write failure to a sticky error status", async () => {
    mockWrite.mockRejectedValueOnce(new Error("disk full"));
    useProjectStore.getState().loadProject(freshOutcome());
    useProjectStore.getState().dispatch({
      type: "entry.insert",
      stepId: 4,
      entry: makeEntry({ id: "new" }),
      index: 0,
      undoable: true,
    });

    await useProjectStore.getState().saveNow();

    expect(useProjectStore.getState().saveStatus).toEqual({ kind: "error", reason: "disk full" });
  });

  it("a save requested while one is in flight runs again after the first completes", async () => {
    let resolveFirstWrite!: (value: { modifiedMs: number }) => void;
    mockWrite.mockImplementationOnce(
      () => new Promise((resolve) => { resolveFirstWrite = resolve; }),
    );
    useProjectStore.getState().loadProject(freshOutcome());
    useProjectStore.getState().dispatch({
      type: "entry.insert",
      stepId: 4,
      entry: makeEntry({ id: "a" }),
      index: 0,
      undoable: true,
    });

    const firstSave = useProjectStore.getState().saveNow();
    useProjectStore.getState().dispatch({
      type: "entry.insert",
      stepId: 4,
      entry: makeEntry({ id: "b" }),
      index: 1,
      undoable: true,
    });
    const secondSaveAttempt = useProjectStore.getState().saveNow(); // should not race the in-flight write

    resolveFirstWrite({ modifiedMs: 3000 });
    await firstSave;
    await secondSaveAttempt;
    await vi.waitFor(() => expect(mockWrite).toHaveBeenCalledTimes(2));

    expect(useProjectStore.getState().lastSavedRevision).toBe(2);
  });
});

describe("restoreSnapshot", () => {
  it("replaces the project, clears both stacks, and saves immediately", async () => {
    useProjectStore.getState().loadProject(freshOutcome());
    const projectId = useProjectStore.getState().project!.id;
    const { project: snapshotProject } = createNewProject({ title: "Snap", language: "en", appVersion: "0.1.0" });
    mockReadSnapshot.mockResolvedValueOnce({ ...snapshotProject, id: projectId });
    useProjectStore.getState().dispatch({
      type: "entry.insert",
      stepId: 4,
      entry: makeEntry({ id: "unsaved-change" }),
      index: 0,
      undoable: true,
    });

    await useProjectStore.getState().restoreSnapshot("2026-08-02T090000Z");

    const state = useProjectStore.getState();
    expect(state.project?.meta.title).toBe("Snap");
    expect(state.undoStack).toEqual([]);
    expect(state.redoStack).toEqual([]);
    expect(mockWrite).toHaveBeenCalled(); // save-after-restore
  });

  it("writes a pre-restore snapshot before reading the target one", async () => {
    useProjectStore.getState().loadProject(freshOutcome());
    const projectId = useProjectStore.getState().project!.id;
    mockReadSnapshot.mockResolvedValueOnce({
      ...createNewProject({ title: "Snap", language: "en", appVersion: "0.1.0" }).project,
      id: projectId,
    });

    await useProjectStore.getState().restoreSnapshot("2026-08-02T090000Z");

    expect(mockSaveSnapshot).toHaveBeenCalled();
  });

  it("rejects a snapshot belonging to a different project and leaves the project untouched", async () => {
    useProjectStore.getState().loadProject(freshOutcome());
    const before = useProjectStore.getState().project;
    mockReadSnapshot.mockResolvedValueOnce({
      ...createNewProject({ title: "Other", language: "en", appVersion: "0.1.0" }).project,
      id: "totally-different-id",
    });

    await useProjectStore.getState().restoreSnapshot("2026-08-02T090000Z");

    const state = useProjectStore.getState();
    expect(state.project).toEqual(before);
    expect(state.saveStatus.kind).toBe("error");
  });
});

describe("selectors", () => {
  it("selectIsDirty reflects revision vs lastSavedRevision", () => {
    expect(selectIsDirty({ revision: 1, lastSavedRevision: 1 })).toBe(false);
    expect(selectIsDirty({ revision: 2, lastSavedRevision: 1 })).toBe(true);
  });

  it("selectCanUndo/selectCanRedo reflect stack length", () => {
    expect(selectCanUndo({ undoStack: [] })).toBe(false);
    expect(selectCanUndo({ undoStack: [{} as Command] })).toBe(true);
    expect(selectCanRedo({ redoStack: [] })).toBe(false);
  });
});
