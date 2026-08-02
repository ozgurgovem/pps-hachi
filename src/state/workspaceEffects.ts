import { getCurrentWindow } from "@tauri-apps/api/window";
import { selectIsDirty, useProjectStore } from "./projectStore";

/** D-72: SPEC.md §4.3's "autosave every 30s". */
const AUTOSAVE_INTERVAL_MS = 30_000;

/** Returns a detach function — call it from the owning `useEffect`'s cleanup. */
export function attachAutosaveInterval(store: typeof useProjectStore): () => void {
  const id = window.setInterval(() => {
    void store.getState().saveNow();
  }, AUTOSAVE_INTERVAL_MS);
  return () => window.clearInterval(id);
}

/**
 * D-84: project undo is global — Ctrl/Cmd+Z always routes here, including
 * while a text field has focus. Native per-field undo is already
 * non-functional on a controlled input, so there is nothing to preserve by
 * excluding text fields, and a single global handler is what "undo/redo
 * across the whole project" (SPEC.md §4.3) actually means.
 */
export function attachUndoRedoKeyboard(store: typeof useProjectStore): () => void {
  function handleKeyDown(event: KeyboardEvent) {
    const isModifier = event.metaKey || event.ctrlKey;
    if (!isModifier || event.key.toLowerCase() !== "z") return;
    event.preventDefault();
    if (event.shiftKey) {
      store.getState().redo();
    } else {
      store.getState().undo();
    }
  }
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}

/**
 * D-72/D-83: blocks the window from closing while a dirty, writable project
 * has a save in flight or pending, and flushes it first. If the flush fails,
 * the window stays open with the D-73 sticky error/conflict status already
 * visible — closing anyway would be the one path that guarantees data loss
 * with no chance to retry.
 */
export async function attachCloseFlush(store: typeof useProjectStore): Promise<() => void> {
  const appWindow = getCurrentWindow();
  const unlisten = await appWindow.onCloseRequested(async (event) => {
    const state = store.getState();
    if (!selectIsDirty(state) || state.readOnly) {
      return;
    }
    event.preventDefault();
    await state.saveNow();
    if (selectIsDirty(store.getState())) {
      // Save failed (conflict/error) — leave the window open rather than
      // discard the unsaved change silently.
      return;
    }
    await appWindow.destroy();
  });
  return unlisten;
}
