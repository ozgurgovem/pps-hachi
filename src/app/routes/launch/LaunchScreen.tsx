import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { getVersion } from "@tauri-apps/api/app";
import { open, save } from "@tauri-apps/plugin-dialog";
import { Button, DialogContent, DialogRoot } from "../../../ui";
import { createProjectAtPath } from "./createProjectFlow";
import { errorMessage } from "./errorMessage";
import { openProjectAtPath } from "./openProjectFlow";
import { RecentProjectCard } from "./RecentProjectCard";
import { useRecentProjects } from "./useRecentProjects";

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

  useEffect(() => {
    document.title = t("app.title");
  }, [t]);

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
    const path = await save({
      title: t("launch.newProjectDialogTitle"),
      filters: PPSX_FILTER,
      defaultPath: "Untitled.ppsx",
    });
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
    const picked = await open({
      title: t("launch.openProjectDialogTitle"),
      filters: PPSX_FILTER,
      multiple: false,
    });
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

      {actionError && (
        <p
          role="alert"
          className="rounded-control border border-danger bg-surface-raised p-3 font-body text-sm text-danger"
        >
          {actionError}
        </p>
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
