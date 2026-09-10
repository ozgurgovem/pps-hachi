import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { getVersion } from "@tauri-apps/api/app";
import { open, save } from "@tauri-apps/plugin-dialog";
import { Button, DialogContent, DialogRoot } from "../../../ui";
import { UiLanguageToggle } from "../../../i18n/UiLanguageToggle";
import { createProjectAtPath } from "./createProjectFlow";
import { errorMessage } from "./errorMessage";
import { openProjectAtPath } from "./openProjectFlow";
import { RecentProjectCard } from "./RecentProjectCard";
import { useRecentProjects } from "./useRecentProjects";
import { useUpdateCheck } from "../../../updates/useUpdateCheck";

const PPSX_FILTER = [{ name: "PPS Hachi Project", extensions: ["ppsx"] }];

function titleFromPath(path: string): string {
  const fileName = path.split(/[/\\]/).pop() ?? path;
  const withoutExtension = fileName.replace(/\.ppsx$/i, "");
  return withoutExtension || "Untitled project";
}

export function LaunchScreen() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { entries, isLoading, error: recentError, refresh } = useRecentProjects();
  const [isBusy, setIsBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  /**
   * Faz 11/L1 (D-223, Barış's own answer — no template picker, only a
   * language choice): before this dilim, `language` was silently derived
   * from the active UI language (`i18n.language`) with no real user
   * choice — this dialog is the first genuine "new project settings"
   * surface. Holds the already-picked save path while the user chooses.
   */
  const [pendingProjectPath, setPendingProjectPath] = useState<string | null>(null);
  const updateCheck = useUpdateCheck();

  useEffect(() => {
    document.title = t("app.title");
  }, [t]);

  /**
   * M2/D-238: the "silent" half of the chosen UX — checks once, on mount,
   * with no visible loading state; a banner appears only when
   * `updateCheck.state.status === "available"` (below). A failed background
   * check (offline, endpoint unreachable) deliberately shows nothing here —
   * `SettingsScreen`'s own manual button is where a check failure is ever
   * surfaced to the user.
   */
  useEffect(() => {
    void updateCheck.checkNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run exactly once per mount, not on every `updateCheck` identity change (checkNow/installNow are stable via useCallback, but re-triggering on their own re-creation would defeat the "once on launch" intent).
  }, []);

  async function openAndNavigate(path: string) {
    setActionError(null);
    setIsBusy(true);
    try {
      const outcome = await openProjectAtPath(path);
      if (outcome.kind === "corrupt") {
        setActionError(t("launch.errors.corrupt", { reason: outcome.reason }));
        return;
      }
      navigate("/project", { state: outcome });
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setIsBusy(false);
      refresh();
    }
  }

  async function handleNewProject() {
    setActionError(null);
    // M4 (2026-09-08): the native `save()` dialog call itself had no
    // try/catch — a rejection (rare, but not impossible: OS-level dialog
    // failures) would have escaped as a genuinely unhandled promise
    // rejection, the exact class of bug D-134/D-136 already fixed twice in
    // this file's own neighboring `a3PreviewWindow/window.ts`.
    let path: string | null;
    try {
      path = await save({
        title: t("launch.newProjectDialogTitle"),
        filters: PPSX_FILTER,
        defaultPath: "Untitled.ppsx",
      });
    } catch (error) {
      setActionError(t("launch.errors.dialogFailed", { reason: errorMessage(error) }));
      return;
    }
    if (!path) {
      return;
    }
    setPendingProjectPath(path);
  }

  async function handleConfirmLanguage(language: "tr" | "en") {
    const path = pendingProjectPath;
    if (!path) {
      return;
    }
    setPendingProjectPath(null);
    setIsBusy(true);
    try {
      const appVersion = await getVersion();
      const outcome = await createProjectAtPath(path, { title: titleFromPath(path), language, appVersion });
      navigate("/project", { state: { kind: "opened", ...outcome, readOnly: false } });
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setIsBusy(false);
      refresh();
    }
  }

  async function handleOpenProject() {
    setActionError(null);
    // M4 (2026-09-08): same fix as `handleNewProject` above — the native
    // `open()` dialog call had no try/catch of its own.
    let picked: string | string[] | null;
    try {
      picked = await open({
        title: t("launch.openProjectDialogTitle"),
        filters: PPSX_FILTER,
        multiple: false,
      });
    } catch (error) {
      setActionError(t("launch.errors.dialogFailed", { reason: errorMessage(error) }));
      return;
    }
    const path = Array.isArray(picked) ? picked[0] : picked;
    if (!path) {
      return;
    }
    await openAndNavigate(path);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 p-10">
      <section className="launch-enter flex flex-wrap items-center justify-between gap-6 border-b border-line pb-8">
        <h1 className="font-display text-4xl font-semibold uppercase tracking-wide text-ink">
          {t("app.title")} <span aria-hidden="true">八</span>
        </h1>
        <div className="flex gap-3">
          <Button size="lg" onClick={() => void handleNewProject()} disabled={isBusy}>
            {t("launch.newProject")}
          </Button>
          <Button size="lg" onClick={() => void handleOpenProject()} disabled={isBusy}>
            {t("launch.openProject")}
          </Button>
        </div>
      </section>

      {/* SPEC.md §2.1's own "Secondary: ... language toggle (TR / EN) ..." row
          — deferred at Phase 2 (2026-08-02), never built until this real gap
          surfaced in Barış's own first trial run (2026-09-10). */}
      <div className="flex justify-end">
        <UiLanguageToggle />
      </div>

      {actionError && (
        <p
          role="alert"
          className="rounded-control border border-danger bg-surface-raised p-3 font-body text-sm text-danger"
        >
          {actionError}
        </p>
      )}

      {(updateCheck.state.status === "available" || updateCheck.state.status === "downloading") && (
        <div className="flex items-center justify-between gap-4 rounded-control border border-accent bg-surface-raised p-3">
          <p className="font-body text-sm text-ink">
            {updateCheck.state.status === "available"
              ? t("settings.updates.launchBannerTitle", { version: updateCheck.state.version })
              : t("settings.updates.downloading")}
          </p>
          {updateCheck.state.status === "available" && (
            <Button size="sm" onClick={() => void updateCheck.installNow()}>
              {t("settings.updates.installButton")}
            </Button>
          )}
        </div>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl uppercase tracking-wide text-ink-muted">{t("launch.recent.title")}</h2>
        {isLoading ? (
          <p className="font-mono text-2xs text-ink-muted">{t("launch.recent.loading")}</p>
        ) : recentError ? (
          <p role="alert" className="font-body text-sm text-danger">
            {t("launch.recent.loadError", { reason: recentError })}
          </p>
        ) : entries.length === 0 ? (
          <p className="font-body text-sm text-ink-muted">{t("launch.recent.empty")}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {entries.map((entry) => (
              <RecentProjectCard key={entry.path} entry={entry} onOpen={openAndNavigate} disabled={isBusy} />
            ))}
          </div>
        )}
      </section>

      <DialogRoot
        open={pendingProjectPath !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingProjectPath(null);
          }
        }}
      >
        <DialogContent title={t("launch.chooseLanguage.title")} description={t("launch.chooseLanguage.description")}>
          <div className="flex gap-3">
            <Button
              className="flex-1"
              variant={i18n.language === "tr" ? "primary" : "secondary"}
              onClick={() => void handleConfirmLanguage("tr")}
            >
              {t("launch.chooseLanguage.turkish")}
            </Button>
            <Button
              className="flex-1"
              variant={i18n.language === "tr" ? "secondary" : "primary"}
              onClick={() => void handleConfirmLanguage("en")}
            >
              {t("launch.chooseLanguage.english")}
            </Button>
          </div>
        </DialogContent>
      </DialogRoot>
    </main>
  );
}
