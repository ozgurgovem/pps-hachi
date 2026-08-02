import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";
import type { OpenProjectOutcome } from "../launch/openProjectFlow";
import { attachAutosaveInterval, attachCloseFlush, attachUndoRedoKeyboard, useProjectStore } from "../../../state";
import { WorkspaceShell } from "./WorkspaceShell";

/**
 * The real Phase 3 workspace, replacing Phase 2's `ProjectPlaceholder` stub.
 * Reads the `OpenProjectOutcome` the launch screen navigated here with,
 * loads it into the project store, and wires the autosave/undo-redo/close
 * effects for as long as this screen is mounted.
 */
export function WorkspaceScreen() {
  const { t } = useTranslation();
  const location = useLocation();
  const state = location.state as OpenProjectOutcome | undefined;
  const loadProject = useProjectStore((s) => s.loadProject);
  const isOpened = Boolean(state && state.kind === "opened");

  useEffect(() => {
    if (state && state.kind === "opened") {
      loadProject(state);
    }
  }, [state, loadProject]);

  useEffect(() => {
    if (!isOpened) {
      return;
    }
    const detachAutosave = attachAutosaveInterval(useProjectStore);
    const detachKeyboard = attachUndoRedoKeyboard(useProjectStore);
    let detachClose: (() => void) | undefined;
    let cancelled = false;
    // Best-effort: outside a real Tauri window (or in a test), there is no
    // close-requested event to hook — the app still works, it just falls
    // back to no flush-on-close instead of crashing.
    attachCloseFlush(useProjectStore)
      .then((detach) => {
        if (cancelled) {
          detach();
        } else {
          detachClose = detach;
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      detachAutosave();
      detachKeyboard();
      detachClose?.();
    };
  }, [isOpened]);

  if (!state || state.kind !== "opened") {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-4 p-10 text-center">
        <p className="font-body text-sm text-ink-muted">{t("project.placeholder.noProjectLoaded")}</p>
        <Link to="/" className="font-body text-sm text-accent underline">
          {t("project.placeholder.backToLaunch")}
        </Link>
      </main>
    );
  }

  return <WorkspaceShell />;
}
