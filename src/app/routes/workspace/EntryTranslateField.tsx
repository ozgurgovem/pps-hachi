import { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { Provenance } from "../../../domain/model";
import { getWholeProjectPromptFile } from "../../../ai/prompts/wholeProjectLibrary";
import { normalizedEditDistance } from "../../../ai/editDistance";
import type { ResolvedRedactionPolicy } from "../../../ai/redaction";
import type { ErasedMethodPlugin } from "../../../methods";
import { Button, Input } from "../../../ui";
import { errorMessage } from "../launch/errorMessage";
import { otherLanguage, proposeEntryTranslation, type ReportLanguage } from "./entryTranslation";

const ENTRY_TRANSLATION_PROMPT_VERSION = "v1";

interface EntryTranslateFieldProps {
  plugin: ErasedMethodPlugin;
  title: string;
  payload: unknown;
  sourceLanguage: ReportLanguage;
  modelId: string;
  acceptedBy: string;
  /** Faz 10/K4: `ai::usage`'s per-project log sidecar needs this — the open project's own id, passed down from `EntryEditorDialog`. */
  projectId: string;
  redaction: ResolvedRedactionPolicy;
  /** Same split as `EntryProposalField.onAccept` (D-125/D-116) — this component never dispatches a command itself, `EntryEditorDialog` decides what accepting a translation means for the mode it's in. */
  onAccept: (nextTitle: string, nextPayload: unknown, provenance: Provenance) => void;
}

type Phase =
  | { readonly phase: "idle" }
  | { readonly phase: "loading" }
  | { readonly phase: "review"; readonly aiTitle: string; readonly aiPayload: unknown; readonly draftTitle: string; readonly draftPayload: unknown }
  | { readonly phase: "failed"; readonly rawText: string }
  | { readonly phase: "error"; readonly message: string };

/**
 * Faz 10/K3/§2.1: unconditional field-level translation — unlike
 * `EntryProposalField` (gated on `plugin.aiProposal`, a method-specific
 * prompt file), translating an entry's title+payload needs no domain
 * knowledge of the method, so this renders for every method whenever AI is
 * configured (D-125's generic-shell pattern, a fifth application). There is
 * no raw-input step (unlike `EntryProposalField`) — the source is always the
 * entry's own current title+payload, so one click goes straight to loading.
 * Accept/Edit&Accept/Reject reuses the plugin's own `Editor` for review, the
 * same D-15 shape `EntryProposalField` already established, plus a plain
 * title `Input` since translation touches the title too.
 */
export function EntryTranslateField({
  plugin,
  title,
  payload,
  sourceLanguage,
  modelId,
  acceptedBy,
  projectId,
  redaction,
  onAccept,
}: EntryTranslateFieldProps) {
  const { t } = useTranslation();
  const [state, setState] = useState<Phase>({ phase: "idle" });
  const targetLanguage = otherLanguage(sourceLanguage);

  async function handleTranslate() {
    const promptFile = getWholeProjectPromptFile("translate-entry", ENTRY_TRANSLATION_PROMPT_VERSION);
    if (!promptFile) {
      setState({ phase: "error", message: t("workspace.entryTranslate.missingPromptFile") });
      return;
    }
    setState({ phase: "loading" });
    try {
      const result = await proposeEntryTranslation({
        promptBody: promptFile.body,
        title,
        payload,
        sourceLanguage,
        targetLanguage,
        modelId,
        zodSchema: z.object({ title: z.string(), payload: plugin.schema }),
        redaction,
        projectId,
        promptVersion: `translate-entry.${ENTRY_TRANSLATION_PROMPT_VERSION}`,
      });
      if (result.outcome === "success") {
        setState({
          phase: "review",
          aiTitle: result.title,
          aiPayload: result.payload,
          draftTitle: result.title,
          draftPayload: result.payload,
        });
      } else {
        setState({ phase: "failed", rawText: result.rawText });
      }
    } catch (error) {
      setState({ phase: "error", message: errorMessage(error) });
    }
  }

  function handleDraftTitleChange(nextTitle: string) {
    if (state.phase !== "review") {
      return;
    }
    setState({ ...state, draftTitle: nextTitle });
  }

  function handleDraftPayloadChange(nextPayload: unknown) {
    if (state.phase !== "review") {
      return;
    }
    setState({ ...state, draftPayload: nextPayload });
  }

  function handleAccept() {
    if (state.phase !== "review") {
      return;
    }
    const aiJson = JSON.stringify({ title: state.aiTitle, payload: state.aiPayload });
    const draftJson = JSON.stringify({ title: state.draftTitle, payload: state.draftPayload });
    const wasEdited = draftJson !== aiJson;
    const generatedAt = new Date().toISOString();
    const provenance: Provenance = {
      origin: wasEdited ? "ai-edited" : "ai-accepted",
      model: {
        providerId: "vorion",
        modelId,
        promptVersion: `translate-entry.${ENTRY_TRANSLATION_PROMPT_VERSION}`,
      },
      generatedAt,
      acceptedBy,
      acceptedAt: generatedAt,
      editDistance: normalizedEditDistance(aiJson, draftJson),
    };
    onAccept(state.draftTitle, state.draftPayload, provenance);
    setState({ phase: "idle" });
  }

  function handleReject() {
    setState({ phase: "idle" });
  }

  const Editor = plugin.Editor;

  if (state.phase === "idle" || state.phase === "loading") {
    return (
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => void handleTranslate()}
        disabled={state.phase === "loading"}
      >
        {state.phase === "loading"
          ? t("workspace.entryTranslate.translating")
          : t(`workspace.entryTranslate.triggerFor.${targetLanguage}`)}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-control border border-border bg-surface-raised p-3">
      <p className="font-display text-sm font-semibold">{t("workspace.entryTranslate.title")}</p>

      {state.phase === "review" && (
        <div className="flex flex-col gap-2">
          <p className="font-body text-sm text-ink-muted">{t("workspace.entryTranslate.reviewHint")}</p>
          <Input
            aria-label={t("workspace.entryTranslate.draftTitleLabel")}
            value={state.draftTitle}
            onChange={(event) => handleDraftTitleChange(event.target.value)}
          />
          <Editor payload={state.draftPayload} onChange={handleDraftPayloadChange} />
          <div className="flex gap-2">
            <Button type="button" onClick={handleAccept}>
              {t("workspace.entryTranslate.accept")}
            </Button>
            <Button type="button" variant="ghost" onClick={handleReject}>
              {t("workspace.entryTranslate.reject")}
            </Button>
          </div>
        </div>
      )}

      {state.phase === "failed" && (
        <div className="flex flex-col gap-2">
          <p role="alert" className="font-body text-sm text-danger">
            {t("workspace.entryTranslate.failed")}
          </p>
          <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-control border border-border bg-surface p-2 font-mono text-2xs text-ink-muted">
            {state.rawText}
          </pre>
          <Button type="button" variant="ghost" onClick={handleReject}>
            {t("workspace.entryTranslate.retry")}
          </Button>
        </div>
      )}

      {state.phase === "error" && (
        <div className="flex flex-col gap-2">
          <p role="alert" className="font-body text-sm text-danger">
            {state.message}
          </p>
          <Button type="button" variant="ghost" onClick={handleReject}>
            {t("workspace.entryTranslate.retry")}
          </Button>
        </div>
      )}
    </div>
  );
}
