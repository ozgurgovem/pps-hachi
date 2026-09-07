import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { cancelCompletion, completeStreaming, type CompletionMeta } from "../../../ai/completionIpc";
import { buildAddEntryCommand } from "../../../domain/commands";
import type { Provenance } from "../../../domain/model";
import { GENERIC_TEXT_METHOD_ID } from "../../../methods/genericText";
import { useProjectStore } from "../../../state";
import { Button, Textarea } from "../../../ui";
import { errorMessage } from "../launch/errorMessage";

/**
 * D-201/§8.7: this dilim's bare chat box has no schema, no step context and
 * no versioned prompt file (`src/ai/prompts/{step}/{methodId}.{version}.md`
 * is a Faz 9 concern) — the raw prompt goes straight to Vorion. This literal
 * stands in for a real `promptVersion` so `Provenance.model.promptVersion`
 * (required whenever `model` is present, D-18) still records *something*
 * traceable back to "this dilim's bare-chat code path" rather than a lie.
 */
const BARE_CHAT_PROMPT_VERSION = "bare-chat-v1";

type AssistantState =
  | { readonly phase: "idle" }
  | {
      readonly phase: "streaming";
      readonly prompt: string;
      readonly text: string;
      readonly conversationId: string | null;
      readonly streamId: string | null;
      readonly cancelling: boolean;
    }
  | {
      readonly phase: "done";
      readonly prompt: string;
      readonly originalText: string;
      readonly meta: CompletionMeta;
      readonly generatedAt: string;
    }
  | { readonly phase: "error"; readonly message: string };

/**
 * D-199 Q3 / §2.4: "no step context, no mode selector, no schema, no
 * persistent history" — free text in, streamed text out. D-15/D-16 still
 * apply in full: nothing reaches `ProjectModel` before an explicit Accept,
 * and the response is shown before it can be accepted, never auto-applied.
 */
export function AssistantPanel() {
  const { t } = useTranslation();
  const project = useProjectStore((s) => s.project);
  const activeStepId = useProjectStore((s) => s.activeStepId);
  const dispatch = useProjectStore((s) => s.dispatch);

  const [promptText, setPromptText] = useState("");
  const [state, setState] = useState<AssistantState>({ phase: "idle" });
  const [editedText, setEditedText] = useState("");

  if (!project) {
    return null;
  }

  const modelId = project.meta.ai.modelId;
  const isStreaming = state.phase === "streaming";

  async function handleSend() {
    const trimmed = promptText.trim();
    if (!trimmed || !modelId || isStreaming) {
      return;
    }
    setPromptText("");
    setState({
      phase: "streaming",
      prompt: trimmed,
      text: "",
      conversationId: null,
      streamId: null,
      cancelling: false,
    });

    try {
      const meta = await completeStreaming(trimmed, modelId, (event) => {
        setState((prev) => {
          if (prev.phase !== "streaming") {
            return prev;
          }
          switch (event.type) {
            case "started":
              return { ...prev, conversationId: event.conversationId, streamId: event.streamId };
            case "chunk":
              return { ...prev, text: prev.text + event.text };
            default:
              return prev;
          }
        });
      });
      const generatedAt = new Date().toISOString();
      setState((prev) => {
        const text = prev.phase === "streaming" ? prev.text : "";
        setEditedText(text);
        return { phase: "done", prompt: trimmed, originalText: text, meta, generatedAt };
      });
    } catch (error) {
      setState((prev) => {
        // SPEC.md §8.14: a stream the user cancelled ends the same way a
        // genuinely failed one does (the connection just closes) — only the
        // `cancelling` flag distinguishes "expected" from "worth surfacing."
        if (prev.phase === "streaming" && prev.cancelling) {
          return { phase: "idle" };
        }
        return { phase: "error", message: errorMessage(error) };
      });
    }
  }

  async function handleCancel() {
    if (state.phase !== "streaming" || !state.conversationId) {
      return;
    }
    setState({ ...state, cancelling: true });
    try {
      await cancelCompletion(state.conversationId, state.streamId);
    } catch {
      // Best-effort — the in-flight `complete()` call settles on its own
      // once Vorion actually closes the stream.
    }
  }

  function handleAccept() {
    if (state.phase !== "done" || !project || activeStepId === null) {
      return;
    }
    const step = project.steps[activeStepId];
    const wasEdited = editedText !== state.originalText;
    const provenance: Provenance = {
      origin: wasEdited ? "ai-edited" : "ai-accepted",
      model: {
        providerId: "vorion",
        modelId: modelId ?? "",
        promptVersion: BARE_CHAT_PROMPT_VERSION,
      },
      generatedAt: state.generatedAt,
      acceptedBy: project.meta.owner.name,
      acceptedAt: new Date().toISOString(),
    };
    dispatch(
      buildAddEntryCommand(step, activeStepId, {
        methodId: GENERIC_TEXT_METHOD_ID,
        // The prompt becomes the title, the response becomes the body — the
        // entries list reads as a Q&A pair rather than a title that's just a
        // truncated copy of its own body.
        title: state.prompt.length > 120 ? `${state.prompt.slice(0, 117)}…` : state.prompt,
        payload: { text: editedText },
        now: new Date().toISOString(),
        provenance,
      }),
    );
    setState({ phase: "idle" });
    setEditedText("");
  }

  function handleReject() {
    setState({ phase: "idle" });
    setEditedText("");
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
      {state.phase === "error" && (
        <p role="alert" className="font-body text-sm text-danger">
          {state.message}
        </p>
      )}

      {(state.phase === "idle" || state.phase === "error") && (
        <div className="flex flex-col gap-2">
          <Textarea
            value={promptText}
            onChange={(event) => setPromptText(event.target.value)}
            placeholder={t("workspace.assistant.promptPlaceholder")}
            aria-label={t("workspace.assistant.promptLabel")}
          />
          <Button onClick={() => void handleSend()} disabled={!promptText.trim()}>
            {t("workspace.assistant.send")}
          </Button>
        </div>
      )}

      {state.phase === "streaming" && (
        <div className="flex flex-col gap-2">
          <div className="whitespace-pre-wrap rounded-control border border-border bg-surface p-3 font-body text-sm text-ink">
            {state.text || t("workspace.assistant.streaming")}
          </div>
          <Button
            variant="secondary"
            onClick={() => void handleCancel()}
            disabled={state.cancelling || !state.conversationId}
          >
            {state.cancelling ? t("workspace.assistant.cancelling") : t("workspace.assistant.cancel")}
          </Button>
        </div>
      )}

      {state.phase === "done" && (
        <div className="flex flex-col gap-2">
          <Textarea
            value={editedText}
            onChange={(event) => setEditedText(event.target.value)}
            aria-label={t("workspace.assistant.responseLabel")}
          />
          {activeStepId === null && (
            <p className="font-body text-xs text-ink-muted">{t("workspace.assistant.noActiveStep")}</p>
          )}
          <div className="flex gap-2">
            <Button onClick={handleAccept} disabled={!editedText.trim() || activeStepId === null}>
              {t("workspace.assistant.accept")}
            </Button>
            <Button variant="ghost" onClick={handleReject}>
              {t("workspace.assistant.reject")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
