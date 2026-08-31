import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Provenance, StepId } from "../../../domain/model";
import { getPromptFile } from "../../../ai/prompts/library";
import { normalizedEditDistance } from "../../../ai/editDistance";
import type { ErasedMethodPlugin } from "../../../methods";
import { Button, Textarea } from "../../../ui";
import { errorMessage } from "../launch/errorMessage";
import { proposeStructuredEntry } from "./entryProposal";

interface EntryProposalFieldProps {
  stepId: StepId;
  plugin: ErasedMethodPlugin;
  /** `plugin.aiProposal.promptVersion` — passed explicitly so this component never has to re-check for `undefined` (the caller only renders it when the field is declared). */
  promptVersion: string;
  modelId: string;
  acceptedBy: string;
  /**
   * D-116/D-125's own posture, one field over: this component never
   * dispatches a command itself — `EntryEditorDialog` decides what
   * "accepting a draft" means for the mode it's in (an immediate discrete
   * update in edit mode, local create-mode state otherwise), the same
   * split `EntryReferenceField`'s `onChange` already draws.
   */
  onAccept: (payload: unknown, provenance: Provenance) => void;
}

type Phase =
  | { readonly phase: "idle" }
  | { readonly phase: "loading" }
  | { readonly phase: "review"; readonly original: unknown; readonly draft: unknown }
  | { readonly phase: "failed"; readonly rawText: string }
  | { readonly phase: "error"; readonly message: string };

/**
 * J1/D-125's fourth "declare, don't render" generic-shell field — the
 * "AI ile öner" trigger next to `EntryEditorDialog`'s title field, only
 * rendered for a method declaring `MethodPlugin.aiProposal`. D-15's real
 * Accept/Edit&Accept/Reject triple (not D-201's collapsed single-textarea
 * pattern, per this dilim's own instruction): the draft is reviewed and
 * edited through the plugin's own `Editor` — the same component used for
 * manual entry — rather than a generic read-only summary, so "editing the
 * proposal" and "manually filling the form" are literally one UI. Accept
 * stays a single button whose `origin` (`ai-accepted` vs `ai-edited`) is
 * computed from whether the draft changed before Accept was clicked — the
 * same mechanism `AssistantPanel` (D-201) already established, now over a
 * structured payload via `normalizedEditDistance` instead of free text.
 */
export function EntryProposalField({
  stepId,
  plugin,
  promptVersion,
  modelId,
  acceptedBy,
  onAccept,
}: EntryProposalFieldProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [rawInput, setRawInput] = useState("");
  const [state, setState] = useState<Phase>({ phase: "idle" });

  function handleOpen() {
    setIsOpen(true);
    setState({ phase: "idle" });
  }

  function handleClose() {
    setIsOpen(false);
    setRawInput("");
    setState({ phase: "idle" });
  }

  async function handlePropose() {
    const trimmed = rawInput.trim();
    if (!trimmed) {
      return;
    }
    const promptFile = getPromptFile(stepId, plugin.id, promptVersion);
    if (!promptFile) {
      setState({ phase: "error", message: t("workspace.entryProposal.missingPromptFile") });
      return;
    }
    setState({ phase: "loading" });
    try {
      const result = await proposeStructuredEntry({
        promptBody: promptFile.body,
        userInput: trimmed,
        modelId,
        zodSchema: plugin.schema,
      });
      if (result.outcome === "success") {
        setState({ phase: "review", original: result.value, draft: result.value });
      } else {
        setState({ phase: "failed", rawText: result.rawText });
      }
    } catch (error) {
      setState({ phase: "error", message: errorMessage(error) });
    }
  }

  function handleDraftChange(nextDraft: unknown) {
    if (state.phase !== "review") {
      return;
    }
    setState({ ...state, draft: nextDraft });
  }

  function handleAccept() {
    if (state.phase !== "review") {
      return;
    }
    const originalJson = JSON.stringify(state.original);
    const draftJson = JSON.stringify(state.draft);
    const wasEdited = draftJson !== originalJson;
    const generatedAt = new Date().toISOString();
    const provenance: Provenance = {
      origin: wasEdited ? "ai-edited" : "ai-accepted",
      model: {
        providerId: "vorion",
        modelId,
        promptVersion: `${plugin.id}.${promptVersion}`,
      },
      generatedAt,
      acceptedBy,
      acceptedAt: generatedAt,
      editDistance: normalizedEditDistance(originalJson, draftJson),
    };
    onAccept(state.draft, provenance);
    handleClose();
  }

  function handleReject() {
    setState({ phase: "idle" });
  }

  const Editor = plugin.Editor;

  if (!isOpen) {
    return (
      <Button type="button" variant="secondary" size="sm" onClick={handleOpen}>
        {t("workspace.entryProposal.trigger")}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-control border border-border bg-surface-raised p-3">
      <p className="font-display text-sm font-semibold">{t("workspace.entryProposal.title")}</p>

      {(state.phase === "idle" || state.phase === "loading") && (
        <div className="flex flex-col gap-2">
          <Textarea
            value={rawInput}
            onChange={(event) => setRawInput(event.target.value)}
            placeholder={t("workspace.entryProposal.inputPlaceholder")}
            aria-label={t("workspace.entryProposal.inputLabel")}
            disabled={state.phase === "loading"}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => void handlePropose()}
              disabled={!rawInput.trim() || state.phase === "loading"}
            >
              {state.phase === "loading" ? t("workspace.entryProposal.proposing") : t("workspace.entryProposal.propose")}
            </Button>
            <Button type="button" variant="ghost" onClick={handleClose} disabled={state.phase === "loading"}>
              {t("workspace.entryProposal.cancel")}
            </Button>
          </div>
        </div>
      )}

      {state.phase === "review" && (
        <div className="flex flex-col gap-2">
          <p className="font-body text-sm text-ink-muted">{t("workspace.entryProposal.reviewHint")}</p>
          <Editor payload={state.draft} onChange={handleDraftChange} />
          <div className="flex gap-2">
            <Button type="button" onClick={handleAccept}>
              {t("workspace.entryProposal.accept")}
            </Button>
            <Button type="button" variant="ghost" onClick={handleReject}>
              {t("workspace.entryProposal.reject")}
            </Button>
          </div>
        </div>
      )}

      {state.phase === "failed" && (
        <div className="flex flex-col gap-2">
          <p role="alert" className="font-body text-sm text-danger">
            {t("workspace.entryProposal.failed")}
          </p>
          <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-control border border-border bg-surface p-2 font-mono text-2xs text-ink-muted">
            {state.rawText}
          </pre>
          <Button type="button" variant="ghost" onClick={handleReject}>
            {t("workspace.entryProposal.retry")}
          </Button>
        </div>
      )}

      {state.phase === "error" && (
        <div className="flex flex-col gap-2">
          <p role="alert" className="font-body text-sm text-danger">
            {state.message}
          </p>
          <Button type="button" variant="ghost" onClick={handleReject}>
            {t("workspace.entryProposal.retry")}
          </Button>
        </div>
      )}
    </div>
  );
}
