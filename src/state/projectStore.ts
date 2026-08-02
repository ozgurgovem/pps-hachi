import { create } from "zustand";
import type { Manifest, ProjectModel, StepId } from "../domain/model";
import {
  applyCommand,
  invertCommand,
  normalizeProject,
  CommandPreconditionError,
  type Command,
  type EntryUpdateCommand,
} from "../domain/commands";
import {
  PpsxWriteConflictError,
  writePpsx,
  saveHistorySnapshot,
  listHistorySnapshots,
  readHistorySnapshot,
  type ArchiveEntryPayload,
} from "../app/routes/launch/ppsxIpc";
import { errorMessage } from "../app/routes/launch/errorMessage";
import type { OpenProjectOutcome } from "../app/routes/launch/openProjectFlow";
import { resolveSnapshotForRestore } from "./restoreSnapshot";
import { formatSnapshotTimestamp } from "./timestamp";

/** D-70: 100-deep, per SPEC.md §4.3. */
const MAX_UNDO_DEPTH = 100;
/** D-84: consecutive edits to the same target within this window merge into one undo entry. */
const TEXT_COALESCE_WINDOW_MS = 600;
/** D-75: rolling, last 20. */
const HISTORY_KEEP_LAST = 20;
/** D-72: step-navigation autosave triggers coalesce into the 30s timer, at most this often. */
const NAVIGATION_SAVE_MIN_INTERVAL_MS = 5000;

export type SaveStatus =
  | { kind: "saved"; at: string }
  | { kind: "saving" }
  | { kind: "unsaved" }
  | { kind: "conflict" }
  | { kind: "error"; reason: string }
  | { kind: "read-only" };

export type LoadableProjectOutcome = Extract<OpenProjectOutcome, { kind: "opened" }>;

export interface ProjectStoreState {
  project: ProjectModel | null;
  manifest: Manifest | null;
  path: string | null;
  otherEntries: ArchiveEntryPayload[];
  diskModifiedMs: number | null;
  readOnly: boolean;
  activeStepId: StepId;

  revision: number;
  lastSavedRevision: number;
  isSaveInFlight: boolean;
  saveAgainRequested: boolean;
  saveStatus: SaveStatus;
  lastNavigationSaveAt: number;

  undoStack: Command[];
  redoStack: Command[];
  lastCoalesceKey: string | null;
  lastCoalesceAt: number;

  historySnapshots: string[];

  loadProject: (outcome: LoadableProjectOutcome) => void;
  setActiveStep: (stepId: StepId) => void;
  dispatch: (command: Command) => void;
  dispatchCoalescedUpdate: (command: EntryUpdateCommand, coalesceKey: string) => void;
  sealTextEditCoalescing: () => void;
  undo: () => void;
  redo: () => void;
  saveNow: () => Promise<void>;
  writeHistorySnapshot: () => Promise<void>;
  refreshHistorySnapshots: () => Promise<void>;
  restoreSnapshot: (timestamp: string) => Promise<void>;
}

/**
 * D-69: Zustand, no immer — `src/state/` holds only store wiring, the
 * undo/redo stacks, the autosave scheduler's data and the keyboard/close
 * hooks that live outside this file (`workspaceEffects.ts`). Every mutation
 * to `project` goes through `applyCommand` (D-70) — nothing here ever
 * assigns into `steps` by hand.
 */
export const useProjectStore = create<ProjectStoreState>()((set, get) => ({
  project: null,
  manifest: null,
  path: null,
  otherEntries: [],
  diskModifiedMs: null,
  readOnly: false,
  activeStepId: 1,

  revision: 0,
  lastSavedRevision: 0,
  isSaveInFlight: false,
  saveAgainRequested: false,
  saveStatus: { kind: "unsaved" },
  lastNavigationSaveAt: 0,

  undoStack: [],
  redoStack: [],
  lastCoalesceKey: null,
  lastCoalesceAt: 0,

  historySnapshots: [],

  loadProject(outcome) {
    set({
      project: normalizeProject(outcome.project),
      manifest: outcome.manifest,
      path: outcome.path,
      otherEntries: outcome.otherEntries,
      diskModifiedMs: outcome.modifiedMs,
      readOnly: outcome.readOnly,
      activeStepId: 1,
      revision: 0,
      lastSavedRevision: 0,
      isSaveInFlight: false,
      saveAgainRequested: false,
      saveStatus: outcome.readOnly ? { kind: "read-only" } : { kind: "saved", at: new Date().toISOString() },
      lastNavigationSaveAt: 0,
      undoStack: [],
      redoStack: [],
      lastCoalesceKey: null,
      lastCoalesceAt: 0,
      historySnapshots: [],
    });
    void get().refreshHistorySnapshots();
    // D-75/F-15: a baseline snapshot on open, independent of the dirty gate
    // `saveNow` otherwise applies — never for a read-only project, which
    // never saves at all (D-59/D-72).
    if (!outcome.readOnly) {
      void get().writeHistorySnapshot();
    }
  },

  setActiveStep(stepId) {
    set({ activeStepId: stepId, lastCoalesceKey: null });
    const now = Date.now();
    if (now - get().lastNavigationSaveAt >= NAVIGATION_SAVE_MIN_INTERVAL_MS) {
      set({ lastNavigationSaveAt: now });
      void get().saveNow();
    }
  },

  dispatch(command) {
    const state = get();
    if (!state.project) return;
    const project = applyCommand(state.project, command);
    set({
      project,
      undoStack: [...state.undoStack, command].slice(-MAX_UNDO_DEPTH),
      redoStack: [],
      lastCoalesceKey: null,
      revision: state.revision + 1,
    });
  },

  dispatchCoalescedUpdate(command, coalesceKey) {
    const state = get();
    if (!state.project) return;
    const project = applyCommand(state.project, command);
    const now = Date.now();
    const canCoalesce =
      state.lastCoalesceKey === coalesceKey &&
      state.undoStack.length > 0 &&
      now - state.lastCoalesceAt < TEXT_COALESCE_WINDOW_MS;

    if (canCoalesce) {
      const top = state.undoStack[state.undoStack.length - 1] as EntryUpdateCommand;
      const merged: EntryUpdateCommand = { ...top, after: command.after };
      set({
        project,
        undoStack: [...state.undoStack.slice(0, -1), merged],
        lastCoalesceAt: now,
        revision: state.revision + 1,
      });
      return;
    }

    set({
      project,
      undoStack: [...state.undoStack, command].slice(-MAX_UNDO_DEPTH),
      redoStack: [],
      lastCoalesceKey: coalesceKey,
      lastCoalesceAt: now,
      revision: state.revision + 1,
    });
  },

  sealTextEditCoalescing() {
    set({ lastCoalesceKey: null });
  },

  undo() {
    const state = get();
    const command = state.undoStack[state.undoStack.length - 1];
    if (!state.project || !command) return;
    try {
      const project = applyCommand(state.project, invertCommand(command));
      set({
        project,
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, command],
        lastCoalesceKey: null,
        revision: state.revision + 1,
      });
    } catch (error) {
      failStacksOnPrecondition(set, error);
    }
  },

  redo() {
    const state = get();
    const command = state.redoStack[state.redoStack.length - 1];
    if (!state.project || !command) return;
    try {
      const project = applyCommand(state.project, command);
      set({
        project,
        redoStack: state.redoStack.slice(0, -1),
        undoStack: [...state.undoStack, command],
        lastCoalesceKey: null,
        revision: state.revision + 1,
      });
    } catch (error) {
      failStacksOnPrecondition(set, error);
    }
  },

  async saveNow() {
    const state = get();
    if (!state.project || !state.manifest || !state.path) return;
    if (state.readOnly) {
      set({ saveStatus: { kind: "read-only" } });
      return;
    }
    if (state.isSaveInFlight) {
      set({ saveAgainRequested: true });
      return;
    }
    if (state.revision === state.lastSavedRevision) {
      return;
    }

    const revisionAtStart = state.revision;
    set({ isSaveInFlight: true, saveStatus: { kind: "saving" } });

    try {
      const manifestToWrite: Manifest = { ...state.manifest, modified: new Date().toISOString() };
      const result = await writePpsx(
        state.path,
        manifestToWrite,
        state.project,
        state.otherEntries,
        state.diskModifiedMs ?? undefined,
      );
      set({
        manifest: manifestToWrite,
        diskModifiedMs: result.modifiedMs,
        // D-72: the revision *at the start* of this write, never the current
        // one — an edit landing mid-write must still read as dirty afterward.
        lastSavedRevision: revisionAtStart,
        saveStatus: { kind: "saved", at: new Date().toISOString() },
        isSaveInFlight: false,
      });
      void get().writeHistorySnapshot();
    } catch (error) {
      set({
        isSaveInFlight: false,
        saveStatus:
          error instanceof PpsxWriteConflictError
            ? { kind: "conflict" }
            : { kind: "error", reason: errorMessage(error) },
      });
    }

    if (get().saveAgainRequested) {
      set({ saveAgainRequested: false });
      await get().saveNow();
    }
  },

  async writeHistorySnapshot() {
    const state = get();
    if (!state.project || !state.manifest) return;
    try {
      const timestamp = formatSnapshotTimestamp(new Date());
      await saveHistorySnapshot(state.manifest.id, timestamp, state.project, HISTORY_KEEP_LAST);
      await get().refreshHistorySnapshots();
    } catch {
      // Best-effort: a failed snapshot must never block or fail the save
      // that (if this was called from saveNow) already succeeded on disk.
    }
  },

  async refreshHistorySnapshots() {
    const state = get();
    if (!state.manifest) return;
    try {
      const snapshots = await listHistorySnapshots(state.manifest.id);
      set({ historySnapshots: snapshots });
    } catch {
      set({ historySnapshots: [] });
    }
  },

  async restoreSnapshot(timestamp) {
    const state = get();
    if (!state.project || !state.manifest) return;

    // D-76/F-15: snapshot the current state before it's discarded, so a
    // restore is itself reversible via history even though not via undo.
    await get().writeHistorySnapshot();

    let raw: unknown;
    try {
      raw = await readHistorySnapshot(state.manifest.id, timestamp);
    } catch (error) {
      set({ saveStatus: { kind: "error", reason: errorMessage(error) } });
      return;
    }

    const resolved = resolveSnapshotForRestore(raw, state.project.id);
    if (!resolved.ok) {
      set({ saveStatus: { kind: "error", reason: resolved.reason } });
      return;
    }

    set((current) => ({
      project: normalizeProject(resolved.project),
      undoStack: [],
      redoStack: [],
      lastCoalesceKey: null,
      revision: current.revision + 1,
    }));

    // D-76: save immediately so memory and disk agree rather than leaving a
    // window where a crash makes it ambiguous which state was intended.
    await get().saveNow();
  },
}));

function failStacksOnPrecondition(set: (partial: Partial<ProjectStoreState>) => void, error: unknown): void {
  if (error instanceof CommandPreconditionError) {
    set({ undoStack: [], redoStack: [], saveStatus: { kind: "error", reason: errorMessage(error) } });
    return;
  }
  throw error;
}

export function selectIsDirty(state: Pick<ProjectStoreState, "revision" | "lastSavedRevision">): boolean {
  return state.revision !== state.lastSavedRevision;
}

export function selectCanUndo(state: Pick<ProjectStoreState, "undoStack">): boolean {
  return state.undoStack.length > 0;
}

export function selectCanRedo(state: Pick<ProjectStoreState, "redoStack">): boolean {
  return state.redoStack.length > 0;
}
