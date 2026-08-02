import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createNewProject } from "../domain/model";
import { attachAutosaveInterval, attachUndoRedoKeyboard } from "./workspaceEffects";
import { useProjectStore } from "./projectStore";

vi.mock("../app/routes/launch/ppsxIpc", async () => {
  const actual = await vi.importActual<typeof import("../app/routes/launch/ppsxIpc")>(
    "../app/routes/launch/ppsxIpc",
  );
  return {
    ...actual,
    writePpsx: vi.fn().mockResolvedValue({ modifiedMs: 2000 }),
    saveHistorySnapshot: vi.fn().mockResolvedValue(undefined),
    listHistorySnapshots: vi.fn().mockResolvedValue([]),
    readHistorySnapshot: vi.fn(),
  };
});

const initialState = useProjectStore.getState();

beforeEach(() => {
  useProjectStore.setState(initialState, true);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function loadFreshProject() {
  const { manifest, project } = createNewProject({ title: "Test", language: "en", appVersion: "0.1.0" });
  useProjectStore.getState().loadProject({
    kind: "opened",
    manifest,
    project,
    path: "/tmp/test.ppsx",
    otherEntries: [],
    modifiedMs: 1000,
    readOnly: false,
  });
}

describe("attachAutosaveInterval", () => {
  it("calls saveNow on the store every 30s while attached", () => {
    vi.useFakeTimers();
    loadFreshProject();
    const saveNowSpy = vi.spyOn(useProjectStore.getState(), "saveNow");

    const detach = attachAutosaveInterval(useProjectStore);
    vi.advanceTimersByTime(30_000);

    expect(saveNowSpy).toHaveBeenCalledTimes(1);
    detach();
  });

  it("stops calling saveNow once detached", () => {
    vi.useFakeTimers();
    loadFreshProject();
    const saveNowSpy = vi.spyOn(useProjectStore.getState(), "saveNow");

    const detach = attachAutosaveInterval(useProjectStore);
    detach();
    vi.advanceTimersByTime(60_000);

    expect(saveNowSpy).not.toHaveBeenCalled();
  });
});

describe("attachUndoRedoKeyboard", () => {
  it("routes Ctrl+Z to store.undo()", () => {
    loadFreshProject();
    const undoSpy = vi.spyOn(useProjectStore.getState(), "undo").mockImplementation(() => {});
    const detach = attachUndoRedoKeyboard(useProjectStore);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "z", ctrlKey: true, bubbles: true }));

    expect(undoSpy).toHaveBeenCalledTimes(1);
    detach();
  });

  it("routes Ctrl+Shift+Z to store.redo()", () => {
    loadFreshProject();
    const redoSpy = vi.spyOn(useProjectStore.getState(), "redo").mockImplementation(() => {});
    const detach = attachUndoRedoKeyboard(useProjectStore);

    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "z", ctrlKey: true, shiftKey: true, bubbles: true }),
    );

    expect(redoSpy).toHaveBeenCalledTimes(1);
    detach();
  });

  it("does not react to Z without a modifier key", () => {
    loadFreshProject();
    const undoSpy = vi.spyOn(useProjectStore.getState(), "undo").mockImplementation(() => {});
    const detach = attachUndoRedoKeyboard(useProjectStore);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "z", bubbles: true }));

    expect(undoSpy).not.toHaveBeenCalled();
    detach();
  });

  it("stops reacting once detached", () => {
    loadFreshProject();
    const undoSpy = vi.spyOn(useProjectStore.getState(), "undo").mockImplementation(() => {});
    const detach = attachUndoRedoKeyboard(useProjectStore);
    detach();

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "z", ctrlKey: true, bubbles: true }));

    expect(undoSpy).not.toHaveBeenCalled();
  });
});
