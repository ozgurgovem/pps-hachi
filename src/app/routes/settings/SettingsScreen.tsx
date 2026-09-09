import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import {
  Button,
  Checkbox,
  DialogContent,
  DialogRoot,
  Input,
  Label,
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "../../../ui";
import { buildSetAiMetaCommand, buildSetProjectInfoCommand, buildSetTemplateIdCommand } from "../../../domain/commands";
import { PROJECT_PRIORITY_OPTIONS, type GeneralRag, type RedactionMode } from "../../../domain/model";
import { listTemplates } from "../../../a3/templates/registry";
import { resolveRedactionPolicy } from "../../../ai/redaction";
import { useProjectStore } from "../../../state";
import { errorMessage } from "../launch/errorMessage";
import { previewTemplateSwitch, type TemplateSwitchDroppedEntry } from "./templateSwitch";
import { useUpdateCheck } from "../../../updates/useUpdateCheck";
import {
  getAiSettings,
  getCostSummary,
  getKeyStatus,
  listModels,
  removeApiKey,
  setAiSettings,
  setApiKey,
  testConnection,
  type AiSettings,
  type ConnectionStatus,
  type CostSummary,
  type ModelInfo,
} from "../../../ai/settingsIpc";

/** Radix `Select` needs a real string value (an empty string is rejected by
 * `Select.Item`, and passing `value={undefined}` conflicts with this
 * project's `exactOptionalPropertyTypes`) — this sentinel stands in for "no
 * model selected" in both selectors below, same pattern as
 * `EntryRoundField`'s `UNTAGGED`/`whyWhyTree`'s `UNSET_OUTCOME`. Translated
 * back to `null` before `AiSettings` is persisted. */
const NO_MODEL_SELECTED = "__none__";
/** Faz 11/L1: same sentinel pattern as `NO_MODEL_SELECTED` — "priority unset"/"RAG unset" both need a real string value Radix `Select` will accept. */
const NO_PRIORITY_SELECTED = "__none__";
const NO_RAG_SELECTED = "__none__";

type KeyState = { status: "loading" } | { status: "unset" } | { status: "set"; masked: string };

/** D-231/P-66: `locale` is the UI's active i18next language (`i18n.language`
 * — this screen is UI-facing, unlike the export-side chart specs) — drives
 * the decimal separator via `Intl.NumberFormat` in place of a locale-blind
 * `.toFixed(4)`. */
function formatCostUsd(costUsd: number, locale: string): string {
  return new Intl.NumberFormat(locale, { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(costUsd);
}

/**
 * Faz 11/L2 §3.1: `null` = no switch pending. `previewTemplateSwitch`'s own
 * dry run decides whether this ever gets set — a target with nothing to
 * warn about switches immediately (`handleSelectTemplate` below), so this
 * state only exists once there is a concrete list of entries to confirm.
 */
type TemplateSwitchState = { readonly targetTemplateId: string; readonly droppedEntries: readonly TemplateSwitchDroppedEntry[] };

/**
 * SPEC.md §8.4's "Settings → AI providers" tab, collapsed to a single card
 * since D-199 settled Faz 8 on one provider (Vorion). §2.1 of this dilim's
 * own session prompt: reached from a gear icon in `WorkspaceTopBar`, not
 * from `LaunchScreen` — a provider can only be configured with a project
 * already open.
 */
export function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const project = useProjectStore((s) => s.project);
  const dispatch = useProjectStore((s) => s.dispatch);
  const [templateSwitchState, setTemplateSwitchState] = useState<TemplateSwitchState | null>(null);
  const updateCheck = useUpdateCheck();
  const [keyState, setKeyState] = useState<KeyState>({ status: "loading" });
  const [keyInput, setKeyInput] = useState("");
  const [keyActionError, setKeyActionError] = useState<string | null>(null);
  const [isKeyActionInFlight, setIsKeyActionInFlight] = useState(false);

  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const [models, setModels] = useState<ModelInfo[]>([]);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  /** Faz 10/K4/§2.5: `null` until a project is open and the first read
   * completes — the display below treats `null` as "nothing to show yet,"
   * never as a zero total. */
  const [costSummary, setCostSummary] = useState<CostSummary | null>(null);

  /** Same "local input, commit on blur" posture as `termsInput` below —
   * `spendCapUsd` is a number a user types digit by digit, not a value that
   * should dispatch an IPC write per keystroke. Synced from `settings.
   * spendCapUsd` (the one external write source besides this field's own
   * blur commit, which round-trips back to the same value). */
  const [spendCapInput, setSpendCapInput] = useState("");
  useEffect(() => {
    setSpendCapInput(settings?.spendCapUsd != null ? String(settings.spendCapUsd) : "");
  }, [settings?.spendCapUsd]);

  /** Faz 10/K4/§2.5: re-read whenever the open project changes or the spend
   * cap itself changes (the cap's value decides `capExceeded`, computed
   * server-side in `ai::commands::ai_get_cost_summary`) — never cached
   * across either. */
  useEffect(() => {
    if (!project) {
      setCostSummary(null);
      return;
    }
    let cancelled = false;
    async function load(openProjectId: string) {
      try {
        const summary = await getCostSummary(openProjectId);
        if (!cancelled) {
          setCostSummary(summary ?? null);
        }
      } catch (error) {
        // M4 polish audit (2026-09-09): this call was previously un-caught —
        // `void load(...)` below with no `.catch` let a rejected `getCostSummary`
        // (no Tauri runtime, true of every test environment) escape as a
        // genuinely unhandled promise rejection, the same bug class D-134/
        // D-136/6c already fixed twice in `a3PreviewWindow/window.ts`. The cost
        // summary is a nice-to-have display (§2.5's own "nothing to show yet"
        // state already covers `null`), so the safe degrade here is simply
        // logging and leaving it `null` rather than surfacing a dedicated
        // error banner for a non-critical panel.
        if (!cancelled) {
          console.error("Failed to load the AI cost summary", error);
        }
      }
    }
    void load(project.id);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on project?.id, not the whole project object (same posture as termsInput's effect above): re-running on every unrelated project change (e.g. an autosave tick) would refetch for no reason.
  }, [project?.id, settings?.spendCapUsd]);

  /** J2/D-205: local so a keystroke doesn't dispatch (and add an undo step)
   * on every character — committed on blur via `handleRedactionTermsChange`.
   * Reset whenever a different project opens, but never while the current
   * project's own `redaction.terms` changes for an unrelated reason (an
   * in-flight edit here should not be blown away by, say, an autosave
   * tick), which is why this depends on `project?.id` rather than `project`. */
  const [termsInput, setTermsInput] = useState("");
  useEffect(() => {
    setTermsInput(resolveRedactionPolicy(project?.meta.ai.redaction).terms.join("\n"));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see comment above
  }, [project?.id]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [masked, loadedSettings] = await Promise.all([getKeyStatus(), getAiSettings()]);
        if (cancelled) {
          return;
        }
        setKeyState(masked ? { status: "set", masked } : { status: "unset" });
        setSettings(loadedSettings);
        if (masked) {
          await refreshModels();
        }
      } catch (error) {
        // M4 polish audit (2026-09-09): unlike `handleSaveKey`/`handleRemoveKey`/
        // `persistSettings` in this same file (all wrapped in try/catch, all
        // surfacing `keyActionError`/`settingsError`), this initial-mount load
        // had none — `void load()` below with no `.catch` let a rejected
        // `getKeyStatus`/`getAiSettings` (no Tauri runtime, true of every test
        // environment) escape as a genuinely unhandled promise rejection, the
        // same bug class D-134/D-136/6c already fixed twice in
        // `a3PreviewWindow/window.ts`. Degrades to `"unset"` (the same safe
        // default `handleRemoveKey` already leaves the screen in) rather than
        // leaving `keyState` stuck on `"loading"` forever, and reuses the
        // existing `settingsError` banner rather than inventing a new one.
        if (!cancelled) {
          setKeyState({ status: "unset" });
          setSettingsError(errorMessage(error));
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshModels() {
    setIsLoadingModels(true);
    setModelsError(null);
    try {
      setModels(await listModels());
    } catch (error) {
      setModelsError(errorMessage(error));
    } finally {
      setIsLoadingModels(false);
    }
  }

  async function handleSaveKey() {
    if (!keyInput) {
      return;
    }
    setIsKeyActionInFlight(true);
    setKeyActionError(null);
    try {
      const masked = await setApiKey(keyInput);
      setKeyState({ status: "set", masked });
      setKeyInput("");
      await refreshModels();
    } catch (error) {
      setKeyActionError(errorMessage(error));
    } finally {
      setIsKeyActionInFlight(false);
    }
  }

  async function handleRemoveKey() {
    setIsKeyActionInFlight(true);
    setKeyActionError(null);
    try {
      await removeApiKey();
      setKeyState({ status: "unset" });
      setModels([]);
      setConnectionStatus(null);
    } catch (error) {
      setKeyActionError(errorMessage(error));
    } finally {
      setIsKeyActionInFlight(false);
    }
  }

  async function persistSettings(next: AiSettings) {
    setSettings(next);
    setSettingsError(null);
    try {
      await setAiSettings(next);
    } catch (error) {
      setSettingsError(errorMessage(error));
    }
  }

  /** SPEC.md §8.12: `null` = no limit, matching `AiSettings.spendCapUsd`'s
   * own convention. A blank field, a negative number, or anything that
   * doesn't parse as a finite number all resolve to "no limit" rather than
   * silently keeping a stale cap — the same "don't guess, fall back to the
   * safe default" posture the rest of this screen's number-adjacent fields
   * already take. */
  function handleSpendCapChange(value: string) {
    if (!settings) {
      return;
    }
    const trimmed = value.trim();
    const parsed = trimmed === "" ? null : Number(trimmed);
    const nextCap = parsed !== null && Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
    void persistSettings({ ...settings, spendCapUsd: nextCap });
  }

  async function handleTestConnection() {
    if (!settings?.defaultModelId) {
      return;
    }
    setIsTestingConnection(true);
    setConnectionStatus(null);
    try {
      setConnectionStatus(await testConnection(settings.defaultModelId));
    } finally {
      setIsTestingConnection(false);
    }
  }

  /**
   * Faz 11/L1 (D-223/D-224): the header identity band's three new fields
   * (D-153/§13.2) — a permanent section, not a temporary debug one like the
   * two below, since there is no future "real" surface this stands in for
   * (unlike `handleToggleProjectAi`'s own §8.5 New Project AI step). Always
   * sends the *complete* `ProjectInfoFields` slice (`buildSetProjectInfoCommand`'s
   * own "whole-slice-replace" contract), pre-filling the two fields not
   * being changed from the project's current values.
   */
  function handleProjectInfoChange(patch: {
    priority?: string | undefined;
    targetClosureDate?: string | undefined;
    generalRag?: GeneralRag | undefined;
  }) {
    if (!project) {
      return;
    }
    dispatch(
      buildSetProjectInfoCommand(project, {
        priority: project.meta.priority,
        targetClosureDate: project.meta.targetClosureDate,
        generalRag: project.meta.generalRag,
        ...patch,
      }),
    );
  }

  /**
   * Faz 11/L2 §3.1: `previewTemplateSwitch` is a pure dry run against the
   * *target* template's own block budgets (D-100) — when it comes back with
   * nothing to warn about, the switch happens immediately (SPEC's own "warns
   * before anything moves to an appendix" only applies when something
   * actually would); otherwise `templateSwitchState` opens the confirmation
   * dialog below rather than dispatching right away.
   */
  function handleSelectTemplate(targetTemplateId: string) {
    if (!project || targetTemplateId === project.templateId) {
      return;
    }
    const preview = previewTemplateSwitch(project, targetTemplateId);
    if (preview.droppedEntries.length === 0) {
      dispatch(buildSetTemplateIdCommand(project, targetTemplateId));
      return;
    }
    setTemplateSwitchState({ targetTemplateId, droppedEntries: preview.droppedEntries });
  }

  function handleConfirmTemplateSwitch() {
    if (!project || !templateSwitchState) {
      return;
    }
    dispatch(buildSetTemplateIdCommand(project, templateSwitchState.targetTemplateId));
    setTemplateSwitchState(null);
  }

  function handleCancelTemplateSwitch() {
    setTemplateSwitchState(null);
  }

  /**
   * D-201: temporary debug control — §8.5's real New Project AI step (enable/
   * provider/model/redaction choice at project creation) doesn't exist yet,
   * so this is the only way to get `project.meta.ai.enabled` to `true` and
   * make the workspace's Assistant tab appear. Falls back to the global
   * default model (Settings' own `defaultModelId`) only when the project
   * doesn't already have one — never overwrites a model already chosen.
   */
  function handleToggleProjectAi(checked: boolean) {
    if (!project) {
      return;
    }
    const nextModelId = project.meta.ai.modelId ?? settings?.defaultModelId ?? undefined;
    dispatch(
      buildSetAiMetaCommand(project, {
        enabled: checked,
        providerId: "vorion",
        redaction: project.meta.ai.redaction,
        ...(nextModelId === undefined ? undefined : { modelId: nextModelId }),
      }),
    );
  }

  /**
   * J2/D-205/§2.2: same temporary-debug posture D-201's `handleToggleProjectAi`
   * already established for `meta.ai.enabled` — §8.5's real New Project AI
   * step is where a redaction policy is meant to be chosen, and it doesn't
   * exist yet. `resolveRedactionPolicy` fills in the two fields left unset.
   */
  function handleRedactionModeChange(mode: RedactionMode) {
    if (!project) {
      return;
    }
    const resolved = resolveRedactionPolicy(project.meta.ai.redaction);
    dispatch(
      buildSetAiMetaCommand(project, {
        ...project.meta.ai,
        redaction: { mode, terms: [...resolved.terms], preserveNumbers: true },
      }),
    );
  }

  function handleRedactionTermsChange(termsText: string) {
    if (!project) {
      return;
    }
    const resolved = resolveRedactionPolicy(project.meta.ai.redaction);
    const terms = termsText.split("\n").map((term) => term.trim()).filter((term) => term.length > 0);
    dispatch(
      buildSetAiMetaCommand(project, {
        ...project.meta.ai,
        redaction: { mode: resolved.mode, terms, preserveNumbers: true },
      }),
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 p-10">
      <div className="flex items-center gap-4 border-b border-line pb-6">
        <Link to="/" className="font-mono text-2xs uppercase tracking-wide text-ink-muted hover:text-ink">
          ← {t("settings.backToLaunch")}
        </Link>
        <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-ink">
          {t("settings.title")}
        </h1>
      </div>

      {/* Faz 11/L1 (D-223): permanent — the header identity band's three new
          `ProjectMetaSchema` fields (D-153/§13.2), exported into
          `pps-8step-auto`'s own identity band (`buildA3Layout.ts`'s
          `resolveHeaderFieldValue`). */}
      <section className="flex flex-col gap-3 rounded-control border border-border bg-surface-raised p-6">
        <h2 className="font-display text-lg text-ink">{t("settings.projectInfo.heading")}</h2>
        {project ? (
          <>
            <div className="flex flex-col gap-2">
              <Label htmlFor="project-priority">{t("settings.projectInfo.priorityLabel")}</Label>
              <SelectRoot
                value={project.meta.priority ?? NO_PRIORITY_SELECTED}
                onValueChange={(value) =>
                  handleProjectInfoChange({ priority: value === NO_PRIORITY_SELECTED ? undefined : value })
                }
              >
                <SelectTrigger id="project-priority">
                  <SelectValue placeholder={t("settings.projectInfo.priorityPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PRIORITY_SELECTED}>{t("settings.projectInfo.priorityUnset")}</SelectItem>
                  {PROJECT_PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="project-target-closure-date">{t("settings.projectInfo.targetClosureDateLabel")}</Label>
              <Input
                id="project-target-closure-date"
                type="date"
                value={project.meta.targetClosureDate ?? ""}
                onChange={(event) =>
                  handleProjectInfoChange({ targetClosureDate: event.target.value || undefined })
                }
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="project-general-rag">{t("settings.projectInfo.generalRagLabel")}</Label>
              <SelectRoot
                value={project.meta.generalRag ?? NO_RAG_SELECTED}
                onValueChange={(value) =>
                  handleProjectInfoChange({
                    generalRag: value === NO_RAG_SELECTED ? undefined : (value as GeneralRag),
                  })
                }
              >
                <SelectTrigger id="project-general-rag">
                  <SelectValue placeholder={t("settings.projectInfo.generalRagPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_RAG_SELECTED}>{t("settings.projectInfo.generalRagUnset")}</SelectItem>
                  <SelectItem value="red">{t("settings.projectInfo.generalRagRed")}</SelectItem>
                  <SelectItem value="amber">{t("settings.projectInfo.generalRagAmber")}</SelectItem>
                  <SelectItem value="green">{t("settings.projectInfo.generalRagGreen")}</SelectItem>
                </SelectContent>
              </SelectRoot>
            </div>
          </>
        ) : (
          <p className="font-body text-sm text-ink-muted">{t("settings.projectInfo.noProject")}</p>
        )}
      </section>

      {/* Faz 11/L2: permanent — SPEC.md §6's own Faz 11 done-condition
          ("switching a project between templates preserves every entry and
          warns before anything moves to an appendix"), D-223's scope
          narrowed to these two templates. */}
      <section className="flex flex-col gap-3 rounded-control border border-border bg-surface-raised p-6">
        <h2 className="font-display text-lg text-ink">{t("settings.template.heading")}</h2>
        {project ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="project-template">{t("settings.template.label")}</Label>
            <SelectRoot value={project.templateId} onValueChange={handleSelectTemplate}>
              <SelectTrigger id="project-template">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {listTemplates().map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {t(`settings.template.names.${template.id}`, { defaultValue: template.name })}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          </div>
        ) : (
          <p className="font-body text-sm text-ink-muted">{t("settings.template.noProject")}</p>
        )}
      </section>

      {/* M2/D-238: permanent — a manual check alongside `LaunchScreen`'s
          silent on-launch check (same `useUpdateCheck` hook, its own
          independent instance — no shared state between the two, per this
          hook's own comment). */}
      <section className="flex flex-col gap-3 rounded-control border border-border bg-surface-raised p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-lg text-ink">{t("settings.updates.heading")}</h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void updateCheck.checkNow()}
            disabled={updateCheck.state.status === "checking" || updateCheck.state.status === "downloading"}
          >
            {updateCheck.state.status === "checking" ? t("settings.updates.checking") : t("settings.updates.checkButton")}
          </Button>
        </div>
        {updateCheck.state.status === "upToDate" && (
          <p className="font-body text-sm text-ink-muted">{t("settings.updates.upToDate")}</p>
        )}
        {updateCheck.state.status === "error" && (
          <p role="alert" className="font-body text-sm text-danger">
            {t("settings.updates.error", { reason: updateCheck.state.message })}
          </p>
        )}
        {updateCheck.state.status === "available" && (
          <div className="flex items-center justify-between gap-4">
            <p className="font-body text-sm text-ink">
              {t("settings.updates.available", {
                version: updateCheck.state.version,
                currentVersion: updateCheck.state.currentVersion,
              })}
            </p>
            <Button size="sm" onClick={() => void updateCheck.installNow()}>
              {t("settings.updates.installButton")}
            </Button>
          </div>
        )}
        {updateCheck.state.status === "downloading" && (
          <p className="font-body text-sm text-ink-muted">{t("settings.updates.downloading")}</p>
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-control border border-border bg-surface-raised p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-lg text-ink">{t("settings.ai.providerName")}</h2>
          <span className="font-mono text-2xs uppercase tracking-wide text-ink-muted">
            {keyState.status === "loading" && t("settings.ai.statusLoading")}
            {keyState.status === "unset" && t("settings.ai.statusNotConnected")}
            {keyState.status === "set" && t("settings.ai.statusConfigured")}
          </span>
        </div>

        {keyState.status !== "loading" && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="ai-api-key">{t("settings.ai.apiKeyLabel")}</Label>
            {keyState.status === "set" && (
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-ink-muted">{keyState.masked}</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void handleRemoveKey()}
                  disabled={isKeyActionInFlight}
                >
                  {t("settings.ai.removeKey")}
                </Button>
              </div>
            )}
            {/* SPEC.md §8.3: "Re-entry replaces; there is no reveal" — the
                paste field always stays available, even once a key is
                configured, so replacing it never requires removing first. */}
            <div className="flex items-center gap-2">
              <Input
                id="ai-api-key"
                type="password"
                autoComplete="off"
                placeholder={
                  keyState.status === "set" ? t("settings.ai.replaceKeyPlaceholder") : t("settings.ai.apiKeyPlaceholder")
                }
                value={keyInput}
                onChange={(event) => setKeyInput(event.target.value)}
              />
              <Button onClick={() => void handleSaveKey()} disabled={!keyInput || isKeyActionInFlight}>
                {t("settings.ai.saveKey")}
              </Button>
            </div>
            {keyActionError && (
              <p role="alert" className="font-body text-sm text-danger">
                {keyActionError}
              </p>
            )}
            <a
              href="https://vorionai.com/profile"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-2xs text-ink-muted hover:text-ink"
            >
              {t("settings.ai.getKeyLink")}
            </a>
          </div>
        )}

        {keyState.status === "set" && settings && (
          <div className="flex flex-col gap-4 border-t border-border pt-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="ai-default-model">{t("settings.ai.defaultModel")}</Label>
                <Button variant="ghost" size="sm" onClick={() => void refreshModels()} disabled={isLoadingModels}>
                  {t("settings.ai.refreshModels")}
                </Button>
              </div>
              {modelsError && (
                <p role="alert" className="font-body text-sm text-danger">
                  {modelsError}
                </p>
              )}
              <SelectRoot
                value={settings.defaultModelId ?? NO_MODEL_SELECTED}
                onValueChange={(value) =>
                  void persistSettings({
                    ...settings,
                    defaultModelId: value === NO_MODEL_SELECTED ? null : value,
                  })
                }
                disabled={isLoadingModels || models.length === 0}
              >
                <SelectTrigger id="ai-default-model">
                  <SelectValue placeholder={t("settings.ai.selectModelPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_MODEL_SELECTED}>{t("settings.ai.noModelSelected")}</SelectItem>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="ai-fast-model">{t("settings.ai.fastModel")}</Label>
              <SelectRoot
                value={settings.fastModelId ?? NO_MODEL_SELECTED}
                onValueChange={(value) =>
                  void persistSettings({
                    ...settings,
                    fastModelId: value === NO_MODEL_SELECTED ? null : value,
                  })
                }
                disabled={isLoadingModels || models.length === 0}
              >
                <SelectTrigger id="ai-fast-model">
                  <SelectValue placeholder={t("settings.ai.selectModelPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_MODEL_SELECTED}>{t("settings.ai.noFastModel")}</SelectItem>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => void handleTestConnection()}
                disabled={!settings.defaultModelId || isTestingConnection}
              >
                {isTestingConnection ? t("settings.ai.testingConnection") : t("settings.ai.testConnection")}
              </Button>
              {connectionStatus &&
                (connectionStatus.success ? (
                  <span className="font-body text-sm text-accent">
                    {t("settings.ai.connectionSuccess", { latency: connectionStatus.latencyMs })}
                  </span>
                ) : (
                  <span role="alert" className="font-body text-sm text-danger">
                    {t("settings.ai.connectionError", { reason: connectionStatus.error ?? "" })}
                  </span>
                ))}
            </div>
          </div>
        )}

        {settingsError && (
          <p role="alert" className="font-body text-sm text-danger">
            {settingsError}
          </p>
        )}

        {settings && (
          <div className="flex items-center gap-2 border-t border-border pt-4">
            <Checkbox
              id="ai-enabled"
              checked={settings.enabled}
              onCheckedChange={(checked) => void persistSettings({ ...settings, enabled: checked === true })}
            />
            <Label htmlFor="ai-enabled">{t("settings.ai.enableAssistance")}</Label>
          </div>
        )}

        {/* Faz 10/K4/§2.5: permanent, not a temporary debug section like the
            two below — SPEC.md §8.12's "visible without hunting for them"
            applies directly, and a spend cap is a real, ongoing setting once
            a key is configured, the same durability class as the model
            selects above. */}
        {settings && (
          <div className="flex flex-col gap-3 border-t border-border pt-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ai-spend-cap">{t("settings.ai.spendCapLabel")}</Label>
              <Input
                id="ai-spend-cap"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder={t("settings.ai.spendCapPlaceholder")}
                value={spendCapInput}
                onChange={(event) => setSpendCapInput(event.target.value)}
                onBlur={() => handleSpendCapChange(spendCapInput)}
              />
              <p className="font-body text-2xs text-ink-muted">{t("settings.ai.spendCapHelp")}</p>
            </div>

            <div className="flex flex-col gap-1 rounded-control border border-border bg-surface p-3">
              <p className="font-display text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {t("settings.ai.costHeading")}
              </p>
              {costSummary ? (
                <>
                  <p className="font-body text-sm text-ink">
                    {t("settings.ai.costProjectTotal", {
                      amount: formatCostUsd(costSummary.project.costUsd, i18n.language),
                      requests: costSummary.project.requestCount,
                    })}
                  </p>
                  <p className="font-body text-sm text-ink">
                    {t("settings.ai.costCurrentMonth", {
                      amount: formatCostUsd(costSummary.currentMonth.costUsd, i18n.language),
                      requests: costSummary.currentMonth.requestCount,
                    })}
                  </p>
                  {costSummary.capExceeded && (
                    <p role="alert" className="font-body text-sm text-danger">
                      {t("settings.ai.spendCapExceededWarning")}
                    </p>
                  )}
                </>
              ) : (
                <p className="font-body text-sm text-ink-muted">{t("settings.ai.costNoProject")}</p>
              )}
              <p className="font-body text-2xs text-ink-muted">{t("settings.ai.costScopeNote")}</p>
            </div>
          </div>
        )}
      </section>

      {/* D-201: temporary, removed once SPEC.md §8.5's real New Project AI
          step ships — see `handleToggleProjectAi`'s own comment. */}
      <section className="flex flex-col gap-2 rounded-control border border-dashed border-border bg-surface-raised p-6">
        <h2 className="font-display text-lg text-ink">{t("settings.ai.debugProjectAiHeading")}</h2>
        <p className="font-body text-sm text-ink-muted">{t("settings.ai.debugProjectAiHint")}</p>
        {project ? (
          <div className="flex items-center gap-2 pt-2">
            <Checkbox
              id="ai-project-enabled-debug"
              checked={project.meta.ai.enabled}
              onCheckedChange={(checked) => handleToggleProjectAi(checked === true)}
            />
            <Label htmlFor="ai-project-enabled-debug">{t("settings.ai.debugProjectAiLabel")}</Label>
          </div>
        ) : (
          <p className="font-body text-sm text-ink-muted">{t("settings.ai.debugProjectAiNoProject")}</p>
        )}
      </section>

      {/* J2/D-205: same temporary-debug posture as the section above — §8.4's
          real "Redaction policy" control lives in the not-yet-built full
          Settings → AI providers screen (SPEC.md §8.4). */}
      <section className="flex flex-col gap-3 rounded-control border border-dashed border-border bg-surface-raised p-6">
        <h2 className="font-display text-lg text-ink">{t("settings.ai.redactionHeading")}</h2>
        <p className="font-body text-sm text-ink-muted">{t("settings.ai.redactionHint")}</p>
        {project ? (
          <>
            <div className="flex flex-col gap-2">
              <Label htmlFor="redaction-mode">{t("settings.ai.redactionModeLabel")}</Label>
              <SelectRoot
                value={resolveRedactionPolicy(project.meta.ai.redaction).mode}
                onValueChange={(value) => handleRedactionModeChange(value as RedactionMode)}
              >
                <SelectTrigger id="redaction-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="off">{t("settings.ai.redactionModeOff")}</SelectItem>
                  <SelectItem value="customers">{t("settings.ai.redactionModeCustomers")}</SelectItem>
                </SelectContent>
              </SelectRoot>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="redaction-terms">{t("settings.ai.redactionTermsLabel")}</Label>
              <Textarea
                id="redaction-terms"
                value={termsInput}
                placeholder={t("settings.ai.redactionTermsPlaceholder")}
                onChange={(event) => setTermsInput(event.target.value)}
                onBlur={() => handleRedactionTermsChange(termsInput)}
              />
            </div>
          </>
        ) : (
          <p className="font-body text-sm text-ink-muted">{t("settings.ai.redactionNoProject")}</p>
        )}
      </section>

      <DialogRoot
        open={templateSwitchState !== null}
        onOpenChange={(open) => {
          if (!open) {
            handleCancelTemplateSwitch();
          }
        }}
      >
        <DialogContent title={t("settings.template.confirmTitle")} description={t("settings.template.confirmDescription")}>
          <ul className="flex flex-col gap-1">
            {templateSwitchState?.droppedEntries.map((entry) => (
              <li key={entry.entryId} className="font-body text-sm text-ink">
                {t("settings.template.droppedEntryLine", { title: entry.title, step: entry.stepId })}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-2">
            <Button type="button" onClick={handleConfirmTemplateSwitch}>
              {t("settings.template.confirmButton")}
            </Button>
            <Button type="button" variant="ghost" onClick={handleCancelTemplateSwitch}>
              {t("settings.template.cancelButton")}
            </Button>
          </div>
        </DialogContent>
      </DialogRoot>
    </main>
  );
}
