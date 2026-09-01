import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import {
  Button,
  Checkbox,
  Input,
  Label,
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "../../../ui";
import { buildSetAiMetaCommand } from "../../../domain/commands";
import type { RedactionMode } from "../../../domain/model";
import { resolveRedactionPolicy } from "../../../ai/redaction";
import { useProjectStore } from "../../../state";
import { errorMessage } from "../launch/errorMessage";
import {
  getAiSettings,
  getKeyStatus,
  listModels,
  removeApiKey,
  setAiSettings,
  setApiKey,
  testConnection,
  type AiSettings,
  type ConnectionStatus,
  type ModelInfo,
} from "../../../ai/settingsIpc";

/** Radix `Select` needs a real string value (an empty string is rejected by
 * `Select.Item`, and passing `value={undefined}` conflicts with this
 * project's `exactOptionalPropertyTypes`) — this sentinel stands in for "no
 * model selected" in both selectors below, same pattern as
 * `EntryRoundField`'s `UNTAGGED`/`whyWhyTree`'s `UNSET_OUTCOME`. Translated
 * back to `null` before `AiSettings` is persisted. */
const NO_MODEL_SELECTED = "__none__";

type KeyState = { status: "loading" } | { status: "unset" } | { status: "set"; masked: string };

/**
 * SPEC.md §8.4's "Settings → AI providers" tab, collapsed to a single card
 * since D-199 settled Faz 8 on one provider (Vorion). §2.1 of this dilim's
 * own session prompt: reached from a gear icon in `WorkspaceTopBar`, not
 * from `LaunchScreen` — a provider can only be configured with a project
 * already open.
 */
export function SettingsScreen() {
  const { t } = useTranslation();
  const project = useProjectStore((s) => s.project);
  const dispatch = useProjectStore((s) => s.dispatch);
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
      const [masked, loadedSettings] = await Promise.all([getKeyStatus(), getAiSettings()]);
      if (cancelled) {
        return;
      }
      setKeyState(masked ? { status: "set", masked } : { status: "unset" });
      setSettings(loadedSettings);
      if (masked) {
        await refreshModels();
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
    </main>
  );
}
