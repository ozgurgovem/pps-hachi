import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { z } from "zod";
import { cancelCompletion, completeStreaming, type CompletionMeta, type StreamEvent } from "../../../ai/completionIpc";
import { normalizedEditDistance } from "../../../ai/editDistance";
import { getWholeProjectPromptFile } from "../../../ai/prompts/wholeProjectLibrary";
import { resolveRedactionPolicy } from "../../../ai/redaction";
import { buildAddEntryCommand, buildUpdateEntryCommand } from "../../../domain/commands";
import type { Provenance, StepId } from "../../../domain/model";
import { getMethodById } from "../../../methods";
import { GENERIC_TEXT_METHOD_ID } from "../../../methods/genericText";
import { getA3RendererMap } from "../../../methods/registry";
import { useProjectStore } from "../../../state";
import { Button, Input, Textarea } from "../../../ui";
import { identifySuggestionTargetEntry, proposeEntryEditFromSuggestion } from "./chatEntryEdit";
import { errorMessage } from "../launch/errorMessage";
import { buildStepAssistantPrompt } from "./stepAiContext";

/**
 * D-201/§8.7: this dilim's bare chat box has no schema, no step context and
 * no versioned prompt file (`src/ai/prompts/{step}/{methodId}.{version}.md`
 * is a Faz 9 concern) — the raw prompt goes straight to Vorion. This literal
 * stands in for a real `promptVersion` so `Provenance.model.promptVersion`
 * (required whenever `model` is present, D-18) still records *something*
 * traceable back to "this dilim's bare-chat code path" rather than a lie.
 */
const BARE_CHAT_PROMPT_VERSION = "bare-chat-v1";
const IDENTIFY_TARGET_PROMPT_VERSION = "v1";
const APPLY_SUGGESTION_PROMPT_VERSION = "v1";

/**
 * D-247 (Barış's own real-use report): once the AI's own review of the
 * step's real entries produces a concrete suggestion, "Apply this to an
 * entry" walks it through two structured calls (`chatEntryEdit.ts`) before
 * anything ever reaches `ProjectModel` — this local sub-state tracks exactly
 * where in that walk a given "done" turn currently is.
 */
type ApplyState =
  | { readonly step: "locating" }
  | { readonly step: "noMatch" }
  | { readonly step: "proposing" }
  | {
      readonly step: "review";
      readonly targetEntryId: string;
      readonly methodId: string;
      readonly aiTitle: string;
      readonly aiPayload: unknown;
      readonly draftTitle: string;
      readonly draftPayload: unknown;
    }
  | { readonly step: "failed"; readonly rawText: string }
  | { readonly step: "error"; readonly message: string };

/**
 * D-245 (Barış's own real-use report): one entry in the conversation — each
 * `Send` appends a new turn rather than replacing a single shared `state`,
 * so a past turn stays visible (and, while still `"done"`, independently
 * actionable) after a follow-up question has already been sent. `id` is a
 * plain `crypto.randomUUID()` (the same UI-layer-id convention every method
 * `Editor` already uses) — purely a React key/lookup handle, never written
 * to `ProjectModel`.
 */
type Turn =
  | {
      readonly id: string;
      readonly phase: "streaming";
      readonly prompt: string;
      readonly text: string;
      readonly conversationId: string | null;
      readonly streamId: string | null;
      readonly cancelling: boolean;
    }
  | {
      readonly id: string;
      readonly phase: "done";
      readonly prompt: string;
      readonly originalText: string;
      readonly editedText: string;
      readonly meta: CompletionMeta;
      readonly generatedAt: string;
      readonly applyState?: ApplyState | undefined;
    }
  | {
      readonly id: string;
      readonly phase: "error";
      readonly prompt: string;
      readonly message: string;
    }
  | {
      readonly id: string;
      readonly phase: "resolved";
      readonly prompt: string;
      readonly responseText: string;
      readonly resolution: "addedAsNote" | "appliedToEntry" | "rejected";
    };

interface AssistantPanelProps {
  /**
   * W2/D-217/P-59: this panel now only ever mounts inside a step page's own
   * `AssistantColumn` (`activeStepId` is never `null` there), so the step is
   * a required prop rather than a store read — the old `activeStepId ===
   * null` guard this component carried (for the landing view, where it used
   * to live inside `RightPanel`) is no longer reachable and has been removed.
   */
  stepId: StepId;
}

/**
 * D-199 Q3 / §2.4 (bare chat, D-201) plus P-59/D-218 (step-scoped, W2): still
 * free text in, streamed text out — but D-245 makes it a real multi-turn
 * conversation rather than a single-shot Q&A: every past turn stays visible,
 * a new question can be sent at any time (not gated behind resolving the
 * previous one), and each turn's own `conversationId` is forwarded into the
 * next `completeStreaming` call so Vorion itself continues that thread
 * server-side — the frontend never re-sends a growing transcript as plain
 * text. D-247 replaced the old single "Accept" (which wrote the *whole raw
 * chat response* as a disconnected `generic-text` entry, even when the
 * response was clearly a suggested edit to one of the user's real entries)
 * with two distinct actions once a response lands: "Apply to an entry"
 * (identifies the real target entry, proposes a schema-validated edit to
 * it, reviewed the same Accept/Edit&Accept/Reject way `EntryProposalField`/
 * `EntryTranslateField` already work) and "Add as a new note" (the old
 * behavior, for a genuinely new, standalone thought). D-15/D-16 still apply
 * in full, per turn: nothing reaches `ProjectModel` before that turn's own
 * explicit accept, and a proposal is always shown before it can be
 * accepted, never auto-applied.
 */
export function AssistantPanel({ stepId }: AssistantPanelProps) {
  const { t, i18n } = useTranslation();
  const project = useProjectStore((s) => s.project);
  const dispatch = useProjectStore((s) => s.dispatch);

  const [promptText, setPromptText] = useState("");
  const [turns, setTurns] = useState<readonly Turn[]>([]);
  const [lastConversationId, setLastConversationId] = useState<string | null>(null);

  if (!project) {
    return null;
  }

  const modelId = project.meta.ai.modelId;
  const isStreaming = turns.some((turn) => turn.phase === "streaming");

  function updateTurn(turnId: string, update: (turn: Turn) => Turn) {
    setTurns((prev) => prev.map((turn) => (turn.id === turnId ? update(turn) : turn)));
  }

  function updateApplyState(turnId: string, applyState: ApplyState | undefined) {
    updateTurn(turnId, (turn) => (turn.phase === "done" ? { ...turn, applyState } : turn));
  }

  async function handleSend() {
    const trimmed = promptText.trim();
    // `project` is narrowed non-null above, but that narrowing doesn't carry
    // into this nested function declaration (the same gotcha D-214 already
    // hit in `LayoutReviewPanel.tsx`) — re-checked here explicitly.
    if (!trimmed || !modelId || isStreaming || !project) {
      return;
    }
    setPromptText("");
    const turnId = crypto.randomUUID();
    const conversationIdForThisTurn = lastConversationId;
    setTurns((prev) => [
      ...prev,
      {
        id: turnId,
        phase: "streaming",
        prompt: trimmed,
        text: "",
        conversationId: null,
        streamId: null,
        cancelling: false,
      },
    ]);

    const language = i18n.language === "tr" ? "tr" : "en";
    const enrichedPrompt = buildStepAssistantPrompt(stepId, language, t, trimmed, project, getA3RendererMap());

    try {
      const meta = await completeStreaming(
        enrichedPrompt,
        modelId,
        (event: StreamEvent) => {
          if (event.type === "started") {
            setLastConversationId(event.conversationId);
          }
          updateTurn(turnId, (turn) => {
            if (turn.phase !== "streaming") {
              return turn;
            }
            switch (event.type) {
              case "started":
                return { ...turn, conversationId: event.conversationId, streamId: event.streamId };
              case "chunk":
                return { ...turn, text: turn.text + event.text };
              default:
                return turn;
            }
          });
        },
        conversationIdForThisTurn,
      );
      const generatedAt = new Date().toISOString();
      setLastConversationId(meta.conversationId);
      updateTurn(turnId, (turn) => {
        const text = turn.phase === "streaming" ? turn.text : "";
        return { id: turnId, phase: "done", prompt: turn.prompt, originalText: text, editedText: text, meta, generatedAt };
      });
    } catch (error) {
      setTurns((prev) => {
        const turn = prev.find((candidate) => candidate.id === turnId);
        // SPEC.md §8.14: a stream the user cancelled ends the same way a
        // genuinely failed one does (the connection just closes) — only the
        // `cancelling` flag distinguishes "expected" from "worth surfacing."
        // A cancelled turn is removed outright rather than kept as an error.
        if (turn?.phase === "streaming" && turn.cancelling) {
          return prev.filter((candidate) => candidate.id !== turnId);
        }
        return prev.map((candidate) =>
          candidate.id === turnId
            ? { id: turnId, phase: "error", prompt: candidate.prompt, message: errorMessage(error) }
            : candidate,
        );
      });
    }
  }

  async function handleCancel(turnId: string) {
    const turn = turns.find((candidate) => candidate.id === turnId);
    if (!turn || turn.phase !== "streaming" || !turn.conversationId) {
      return;
    }
    const { conversationId, streamId } = turn;
    updateTurn(turnId, (candidate) =>
      candidate.phase === "streaming" ? { ...candidate, cancelling: true } : candidate,
    );
    try {
      await cancelCompletion(conversationId, streamId);
    } catch {
      // Best-effort — the in-flight `complete()` call settles on its own
      // once Vorion actually closes the stream.
    }
  }

  function handleAddAsNote(turnId: string) {
    const turn = turns.find((candidate) => candidate.id === turnId);
    if (!turn || turn.phase !== "done" || !project) {
      return;
    }
    const step = project.steps[stepId];
    const wasEdited = turn.editedText !== turn.originalText;
    const provenance: Provenance = {
      origin: wasEdited ? "ai-edited" : "ai-accepted",
      model: {
        providerId: "vorion",
        modelId: modelId ?? "",
        promptVersion: BARE_CHAT_PROMPT_VERSION,
      },
      generatedAt: turn.generatedAt,
      acceptedBy: project.meta.owner.name,
      acceptedAt: new Date().toISOString(),
    };
    dispatch(
      buildAddEntryCommand(step, stepId, {
        methodId: GENERIC_TEXT_METHOD_ID,
        // The prompt becomes the title, the response becomes the body — the
        // entries list reads as a Q&A pair rather than a title that's just a
        // truncated copy of its own body.
        title: turn.prompt.length > 120 ? `${turn.prompt.slice(0, 117)}…` : turn.prompt,
        payload: { text: turn.editedText },
        now: new Date().toISOString(),
        provenance,
      }),
    );
    updateTurn(turnId, () => ({
      id: turnId,
      phase: "resolved",
      prompt: turn.prompt,
      responseText: turn.editedText,
      resolution: "addedAsNote",
    }));
  }

  function handleReject(turnId: string) {
    const turn = turns.find((candidate) => candidate.id === turnId);
    if (!turn || turn.phase !== "done") {
      return;
    }
    updateTurn(turnId, () => ({
      id: turnId,
      phase: "resolved",
      prompt: turn.prompt,
      responseText: turn.editedText,
      resolution: "rejected",
    }));
  }

  function handleEditedTextChange(turnId: string, value: string) {
    updateTurn(turnId, (turn) => (turn.phase === "done" ? { ...turn, editedText: value } : turn));
  }

  /**
   * D-247: step 1 of "Apply to an entry" — identify which real entry (if
   * any) this turn's own response is suggesting an edit for.
   */
  async function handleStartApply(turnId: string) {
    const turn = turns.find((candidate) => candidate.id === turnId);
    if (!turn || turn.phase !== "done" || !project || !modelId) {
      return;
    }
    const step = project.steps[stepId];
    const entries = step?.entries ?? [];

    updateApplyState(turnId, { step: "locating" });

    const identifyPromptFile = getWholeProjectPromptFile("identify-suggestion-target", IDENTIFY_TARGET_PROMPT_VERSION);
    if (!identifyPromptFile) {
      updateApplyState(turnId, { step: "error", message: t("workspace.assistant.missingPromptFile") });
      return;
    }

    const redaction = resolveRedactionPolicy(project.meta.ai.redaction);
    const rendererMap = getA3RendererMap();

    let identifyResult;
    try {
      identifyResult = await identifySuggestionTargetEntry({
        promptBody: identifyPromptFile.body,
        suggestionText: turn.editedText,
        entries,
        project,
        rendererMap,
        modelId,
        redaction,
        projectId: project.id,
      });
    } catch (error) {
      updateApplyState(turnId, { step: "error", message: errorMessage(error) });
      return;
    }

    if (identifyResult.outcome === "failed") {
      updateApplyState(turnId, { step: "failed", rawText: identifyResult.rawText });
      return;
    }
    if (identifyResult.outcome === "noMatch") {
      updateApplyState(turnId, { step: "noMatch" });
      return;
    }

    const targetEntry = entries.find((entry) => entry.id === identifyResult.targetEntryId);
    const plugin = targetEntry ? getMethodById(targetEntry.methodId) : undefined;
    if (!targetEntry || !plugin) {
      updateApplyState(turnId, { step: "noMatch" });
      return;
    }

    updateApplyState(turnId, { step: "proposing" });

    const applyPromptFile = getWholeProjectPromptFile("apply-suggestion", APPLY_SUGGESTION_PROMPT_VERSION);
    if (!applyPromptFile) {
      updateApplyState(turnId, { step: "error", message: t("workspace.assistant.missingPromptFile") });
      return;
    }

    let editResult;
    try {
      editResult = await proposeEntryEditFromSuggestion({
        promptBody: applyPromptFile.body,
        suggestionText: turn.editedText,
        title: targetEntry.title,
        payload: targetEntry.payload,
        modelId,
        zodSchema: z.object({ title: z.string(), payload: plugin.schema }),
        redaction,
        projectId: project.id,
        promptVersion: `apply-suggestion.${APPLY_SUGGESTION_PROMPT_VERSION}`,
      });
    } catch (error) {
      updateApplyState(turnId, { step: "error", message: errorMessage(error) });
      return;
    }

    if (editResult.outcome === "failed") {
      updateApplyState(turnId, { step: "failed", rawText: editResult.rawText });
      return;
    }

    updateApplyState(turnId, {
      step: "review",
      targetEntryId: targetEntry.id,
      methodId: targetEntry.methodId,
      aiTitle: editResult.title,
      aiPayload: editResult.payload,
      draftTitle: editResult.title,
      draftPayload: editResult.payload,
    });
  }

  function handleCancelApply(turnId: string) {
    updateApplyState(turnId, undefined);
  }

  function handleApplyDraftTitleChange(turnId: string, nextTitle: string) {
    updateTurn(turnId, (turn) =>
      turn.phase === "done" && turn.applyState?.step === "review"
        ? { ...turn, applyState: { ...turn.applyState, draftTitle: nextTitle } }
        : turn,
    );
  }

  function handleApplyDraftPayloadChange(turnId: string, nextPayload: unknown) {
    updateTurn(turnId, (turn) =>
      turn.phase === "done" && turn.applyState?.step === "review"
        ? { ...turn, applyState: { ...turn.applyState, draftPayload: nextPayload } }
        : turn,
    );
  }

  function handleAcceptEntryEdit(turnId: string) {
    const turn = turns.find((candidate) => candidate.id === turnId);
    if (!turn || turn.phase !== "done" || !turn.applyState || turn.applyState.step !== "review" || !project) {
      return;
    }
    const step = project.steps[stepId];
    if (!step) {
      return;
    }
    const { targetEntryId, aiTitle, aiPayload, draftTitle, draftPayload } = turn.applyState;
    const aiJson = JSON.stringify({ title: aiTitle, payload: aiPayload });
    const draftJson = JSON.stringify({ title: draftTitle, payload: draftPayload });
    const wasEdited = draftJson !== aiJson;
    const generatedAt = new Date().toISOString();
    const provenance: Provenance = {
      origin: wasEdited ? "ai-edited" : "ai-accepted",
      model: {
        providerId: "vorion",
        modelId: modelId ?? "",
        promptVersion: `apply-suggestion.${APPLY_SUGGESTION_PROMPT_VERSION}`,
      },
      generatedAt,
      acceptedBy: project.meta.owner.name,
      acceptedAt: generatedAt,
      editDistance: normalizedEditDistance(aiJson, draftJson),
    };
    dispatch(
      buildUpdateEntryCommand(step, stepId, targetEntryId, {
        title: draftTitle,
        payload: draftPayload,
        now: generatedAt,
        provenance,
      }),
    );
    updateTurn(turnId, () => ({
      id: turnId,
      phase: "resolved",
      prompt: turn.prompt,
      responseText: turn.editedText,
      resolution: "appliedToEntry",
    }));
  }

  function handleRejectEntryEdit(turnId: string) {
    updateApplyState(turnId, undefined);
  }

  if (!modelId) {
    return (
      <p className="font-body text-sm text-ink-muted">
        {t("workspace.assistant.noModelConfigured")}{" "}
        <Link to="/settings" className="text-accent hover:underline">
          {t("workspace.assistant.goToSettings")}
        </Link>
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {turns.map((turn) => (
        <div key={turn.id} className="flex flex-col gap-2">
          <p className="font-body text-sm font-medium text-ink">{turn.prompt}</p>

          {turn.phase === "streaming" && (
            <div className="flex flex-col gap-2">
              <div className="whitespace-pre-wrap rounded-control border border-border bg-surface p-3 font-body text-sm text-ink">
                {turn.text || t("workspace.assistant.streaming")}
              </div>
              <Button
                variant="secondary"
                onClick={() => void handleCancel(turn.id)}
                disabled={turn.cancelling || !turn.conversationId}
              >
                {turn.cancelling ? t("workspace.assistant.cancelling") : t("workspace.assistant.cancel")}
              </Button>
            </div>
          )}

          {turn.phase === "error" && (
            <p role="alert" className="font-body text-sm text-danger">
              {turn.message}
            </p>
          )}

          {turn.phase === "done" && (
            <div className="flex flex-col gap-2">
              {/* D-248 (Barış's own real-use report): the response stays visible and
                  readable through every step of "Apply to an entry" — it used to
                  disappear the instant that flow started, losing the AI's own
                  suggestion right when the user most needed to see it while
                  reviewing/waiting. Locked (`disabled`, dimmed) rather than editable
                  once a flow is under way, so it reads as "this is what's being
                  acted on" without inviting an edit that flow no longer reflects. */}
              <Textarea
                value={turn.editedText}
                onChange={(event) => handleEditedTextChange(turn.id, event.target.value)}
                aria-label={t("workspace.assistant.responseLabel")}
                disabled={Boolean(turn.applyState)}
              />

              {!turn.applyState && (
                <div className="flex flex-col gap-2">
                  <Button
                    className="w-full"
                    onClick={() => void handleStartApply(turn.id)}
                    disabled={!turn.editedText.trim()}
                  >
                    {t("workspace.assistant.applyToEntry")}
                  </Button>
                  <Button
                    className="w-full"
                    variant="secondary"
                    onClick={() => handleAddAsNote(turn.id)}
                    disabled={!turn.editedText.trim()}
                  >
                    {t("workspace.assistant.addAsNote")}
                  </Button>
                  <Button className="w-full" variant="ghost" onClick={() => handleReject(turn.id)}>
                    {t("workspace.assistant.reject")}
                  </Button>
                </div>
              )}

              {turn.applyState?.step === "locating" && (
                <p className="font-body text-sm text-ink-muted">{t("workspace.assistant.locatingEntry")}</p>
              )}

              {turn.applyState?.step === "proposing" && (
                <p className="font-body text-sm text-ink-muted">{t("workspace.assistant.proposingEdit")}</p>
              )}

              {turn.applyState?.step === "noMatch" && (
                <div className="flex flex-col gap-2">
                  <p className="font-body text-sm text-ink-muted">{t("workspace.assistant.noEntryMatch")}</p>
                  <Button variant="ghost" onClick={() => handleCancelApply(turn.id)}>
                    {t("workspace.assistant.back")}
                  </Button>
                </div>
              )}

              {turn.applyState?.step === "failed" && (
                <div className="flex flex-col gap-2">
                  <p role="alert" className="font-body text-sm text-danger">
                    {t("workspace.assistant.applyFailed")}
                  </p>
                  <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-control border border-border bg-surface p-2 font-mono text-2xs text-ink-muted">
                    {turn.applyState.rawText}
                  </pre>
                  <Button variant="ghost" onClick={() => handleCancelApply(turn.id)}>
                    {t("workspace.assistant.back")}
                  </Button>
                </div>
              )}

              {turn.applyState?.step === "error" && (
                <div className="flex flex-col gap-2">
                  <p role="alert" className="font-body text-sm text-danger">
                    {turn.applyState.message}
                  </p>
                  <Button variant="ghost" onClick={() => handleCancelApply(turn.id)}>
                    {t("workspace.assistant.back")}
                  </Button>
                </div>
              )}

              {turn.applyState?.step === "review" &&
                (() => {
                  const applyState = turn.applyState;
                  const plugin = getMethodById(applyState.methodId);
                  if (!plugin) {
                    return null;
                  }
                  const Editor = plugin.Editor;
                  return (
                    <div className="flex flex-col gap-2 rounded-control border border-border bg-surface p-3">
                      <p className="font-body text-sm text-ink-muted">{t("workspace.assistant.reviewEntryEditHint")}</p>
                      <Input
                        aria-label={t("workspace.assistant.draftTitleLabel")}
                        value={applyState.draftTitle}
                        onChange={(event) => handleApplyDraftTitleChange(turn.id, event.target.value)}
                      />
                      <Editor
                        payload={applyState.draftPayload}
                        onChange={(nextPayload) => handleApplyDraftPayloadChange(turn.id, nextPayload)}
                      />
                      <div className="flex gap-2">
                        <Button onClick={() => handleAcceptEntryEdit(turn.id)}>
                          {t("workspace.assistant.acceptEntryEdit")}
                        </Button>
                        <Button variant="ghost" onClick={() => handleRejectEntryEdit(turn.id)}>
                          {t("workspace.assistant.reject")}
                        </Button>
                      </div>
                    </div>
                  );
                })()}
            </div>
          )}

          {turn.phase === "resolved" && (
            <div className="flex flex-col gap-1 rounded-control border border-border bg-surface p-3">
              <p className="whitespace-pre-wrap font-body text-sm text-ink-muted">{turn.responseText}</p>
              <span className="font-mono text-2xs uppercase tracking-wide text-ink-muted">
                {turn.resolution === "addedAsNote" && t("workspace.assistant.turnAddedAsNote")}
                {turn.resolution === "appliedToEntry" && t("workspace.assistant.turnAppliedToEntry")}
                {turn.resolution === "rejected" && t("workspace.assistant.turnRejected")}
              </span>
            </div>
          )}
        </div>
      ))}

      <div className="flex flex-col gap-2">
        <Textarea
          value={promptText}
          onChange={(event) => setPromptText(event.target.value)}
          placeholder={t("workspace.assistant.promptPlaceholder")}
          aria-label={t("workspace.assistant.promptLabel")}
        />
        <Button onClick={() => void handleSend()} disabled={!promptText.trim() || isStreaming}>
          {t("workspace.assistant.send")}
        </Button>
      </div>
    </div>
  );
}
