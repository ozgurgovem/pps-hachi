import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { getVersion } from "@tauri-apps/api/app";
import farplasLogoUrl from "../../../assets/brand/farplas-logo.png";
import { STEP_IDS } from "../../../domain/model";
import { Button, DialogContent, DialogRoot } from "../../../ui";
import { UiLanguageToggle } from "../../../i18n/UiLanguageToggle";
import { open, save } from "../../../testing/nativeDialogs";
import { createProjectAtPath } from "./createProjectFlow";
import { errorMessage } from "./errorMessage";
import { IntroAnimation } from "./IntroAnimation";
import { markIntroPlayed, shouldShowIntro } from "./introSeen";
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
  /**
   * Barış's own request, 2026-09-16 — a Farplas-branded intro sequence
   * (`IntroAnimation.tsx`), shown once per app launch (his own chosen
   * option over "every visit to /"). `shouldShowIntro` folds in the
   * reduced-motion and test-environment gates, so this line is the only
   * place either one is consulted.
   */
  const [showIntro, setShowIntro] = useState(() => shouldShowIntro(import.meta.env.MODE));

  function handleIntroFinish() {
    markIntroPlayed();
    setShowIntro(false);
  }

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
    <div className="flex min-h-screen flex-col bg-white dark:bg-surface">
      {showIntro && <IntroAnimation onFinish={handleIntroFinish} />}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-fp-gray-light px-6 py-4 sm:px-10">
        <div className="flex items-center gap-4">
          <img src={farplasLogoUrl} alt={t("launch.brandWordmark")} className="h-6 w-auto" />
          <span aria-hidden="true" className="h-5 w-px bg-fp-gray-light" />
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-fp-gray-dark">
            {t("app.title")}
          </span>
        </div>
        {/* SPEC.md §2.1's own "Secondary: ... language toggle (TR / EN) ..." row
            — deferred at Phase 2 (2026-08-02), never built until this real gap
            surfaced in Barış's own first trial run (2026-09-10). */}
        <UiLanguageToggle />
      </header>

      {(actionError ||
        updateCheck.state.status === "available" ||
        updateCheck.state.status === "downloading") && (
        <div className="flex flex-col gap-3 px-6 pt-6 sm:px-10">
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
        </div>
      )}

      <main className="grid flex-1 grid-cols-1 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="launch-enter flex min-w-0 flex-col gap-10 px-6 py-12 sm:px-10 sm:py-14">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span aria-hidden="true" className="block h-0.5 w-7 bg-fp-red" />
              <span className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-fp-red">
                {t("launch.eyebrow")}
              </span>
            </div>
            <h1 className="flex flex-wrap items-baseline gap-4 font-fp-display text-4xl font-bold uppercase tracking-tight text-fp-charcoal">
              {t("app.title")}
              <span aria-hidden="true" className="text-3xl font-normal text-fp-teal">
                八
              </span>
            </h1>
            <p className="mt-4 font-fp-slogan text-lg font-bold tracking-wide text-fp-teal-deep">{t("launch.slogan")}</p>
            <p className="mt-5 max-w-[48ch] text-pretty font-body text-base leading-relaxed text-fp-gray-dark">
              {t("launch.description")}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button size="lg" onClick={() => void handleNewProject()} disabled={isBusy}>
              {t("launch.newProject")}
            </Button>
            <Button size="lg" variant="secondary" onClick={() => void handleOpenProject()} disabled={isBusy}>
              {t("launch.openProject")}
            </Button>
          </div>

          <div className="mt-auto grid grid-cols-3 gap-7 border-t border-fp-gray-light pt-7">
            <div>
              <div className="font-fp-display text-2xl font-bold text-fp-charcoal">A3</div>
              <div className="mt-1.5 font-mono text-xs uppercase tracking-wide text-fp-gray-dark">
                {t("launch.stats.format")}
              </div>
            </div>
            <div>
              <div className="font-fp-display text-2xl font-bold text-fp-charcoal">{STEP_IDS.length}</div>
              <div className="mt-1.5 font-mono text-xs uppercase tracking-wide text-fp-gray-dark">
                {t("launch.stats.methodSteps")}
              </div>
            </div>
            <div>
              <div className="font-fp-display text-2xl font-bold text-fp-charcoal">{entries.length}</div>
              <div className="mt-1.5 font-mono text-xs uppercase tracking-wide text-fp-gray-dark">
                {t("launch.stats.savedProjects")}
              </div>
            </div>
          </div>
        </section>

        <aside className="min-w-0 border-t border-fp-gray-light bg-surface-raised px-6 py-12 sm:px-10 sm:py-14 lg:border-t-0 lg:border-l">
          <div className="mb-5 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-fp-teal-deep">
            {t("launch.methodAside.title")}
          </div>
          <ol className="m-0 grid list-none gap-0 p-0">
            {STEP_IDS.map((stepId) => (
              <li
                key={stepId}
                className="grid grid-cols-[34px_minmax(0,1fr)] items-baseline gap-3.5 border-b border-fp-gray-light py-3"
              >
                <span className="font-mono text-sm font-bold tabular-nums text-fp-teal-deep">
                  {String(stepId).padStart(2, "0")}
                </span>
                <span className="font-body text-[15px] font-semibold text-fp-charcoal">
                  {t(`workspace.steps.${stepId}.name`)}
                </span>
              </li>
            ))}
          </ol>
        </aside>
      </main>

      <section className="border-t border-fp-gray-light px-6 py-10 sm:px-10">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-fp-red">
            {t("launch.recent.title")}
          </h2>
        </div>
        {isLoading ? (
          <p className="font-mono text-2xs text-fp-gray-dark">{t("launch.recent.loading")}</p>
        ) : recentError ? (
          <p role="alert" className="font-body text-sm text-danger">
            {t("launch.recent.loadError", { reason: recentError })}
          </p>
        ) : entries.length === 0 ? (
          <p className="font-body text-sm text-fp-gray-dark">{t("launch.recent.empty")}</p>
        ) : (
          <div className="flex flex-col gap-2 border-t border-fp-gray-light">
            {entries.map((entry) => (
              <RecentProjectCard key={entry.path} entry={entry} onOpen={openAndNavigate} disabled={isBusy} />
            ))}
          </div>
        )}
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-fp-gray-light bg-surface-raised px-6 py-5 sm:px-10">
        <span className="font-fp-slogan text-sm font-bold tracking-wide text-fp-teal-deep">{t("launch.footer.tagline")}</span>
        <span className="font-mono text-xs tracking-wide text-fp-gray-dark">{t("launch.footer.brand")}</span>
      </footer>

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
    </div>
  );
}
