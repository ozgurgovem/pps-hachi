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
 *
 * Real gap found in Barış's own first trial run (2026-09-10): "is a project
 * open" used to be judged purely from `location.state`, which only ever
 * arrives fresh from `LaunchScreen`'s own `navigate("/project", {state})`
 * calls. Returning here any other way (`SettingsScreen`'s own back link,
 * which can only ever be reached from an already-open workspace in the
 * first place) landed on this component with no `state` at all, so it fell
 * through to the "no project loaded" placeholder and sent the user all the
 * way back to the launch screen — even though `useProjectStore` still held
 * the real, already-loaded project in memory the whole time. `isOpened` now
 * also accepts an already-loaded store project as sufficient, independent
 * of how this screen was reached.
 */
export function WorkspaceScreen() {
  const { t } = useTranslation();
  const location = useLocation();
  const state = location.state as OpenProjectOutcome | undefined;
  const loadProject = useProjectStore((s) => s.loadProject);
  const storeHasProject = useProjectStore((s) => s.project !== null);
  const isOpened = Boolean((state && state.kind === "opened") || storeHasProject);

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

  if (!isOpened) {
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
