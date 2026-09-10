import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import "../../../i18n";
import { createNewProject } from "../../../domain/model";
import type { AiMeta, Entry, ProjectModel, StepId } from "../../../domain/model";
import { GENERIC_TEXT_METHOD_ID } from "../../../methods/genericText";
import { useProjectStore } from "../../../state";
import { AssistantPanel } from "./AssistantPanel";
import { getCoachingMarkdown } from "./coachContent";
import * as completionIpc from "../../../ai/completionIpc";
import type { CompletionMeta, StreamEvent } from "../../../ai/completionIpc";
import * as chatEntryEdit from "./chatEntryEdit";

vi.mock("../../../ai/completionIpc");
vi.mock("./chatEntryEdit");

const mocked = vi.mocked(completionIpc);
const mockedChatEntryEdit = vi.mocked(chatEntryEdit);
const initialStoreState = useProjectStore.getState();

function makeEntry(overrides: Partial<Entry> = {}): Entry {
  const now = new Date().toISOString();
  return {
    id: overrides.id ?? crypto.randomUUID(),
    methodId: "generic-text",
    title: "An existing entry",
    order: 0,
    a3Visibility: "primary",
    payload: { text: "existing body" },
    images: [],
    createdAt: now,
    updatedAt: now,
    provenance: { origin: "human" },
    ...overrides,
  };
}

function seedProject(aiOverrides: Partial<AiMeta> = {}, entries: Entry[] = []): ProjectModel {
  const { project } = createNewProject({ title: "T", language: "en", appVersion: "0.1.0" });
  const withAi: ProjectModel = {
    ...project,
    meta: {
      ...project.meta,
      owner: { name: "Ada" },
      ai: { enabled: true, providerId: "vorion", modelId: "openai/gpt-4o", redaction: {}, ...aiOverrides },
    },
    steps: { ...project.steps, 1: { entries } },
  };
  useProjectStore.setState({ ...initialStoreState, project: withAi });
  return withAi;
}

// W2/D-217/P-59: `AssistantPanel` only ever mounts inside a step's own
// `AssistantColumn` now — `stepId` is a required prop, not a store read.
function renderPanel(stepId: StepId = 1) {
  return render(
    <MemoryRouter>
      <AssistantPanel stepId={stepId} />
    </MemoryRouter>,
  );
}

/** Never resolves — enough for tests that only exercise the streaming phase. */
function pendingCompletion() {
  return new Promise<CompletionMeta>(() => {});
}

/** Sends "hi", resolves it with `responseText`, and returns once the "done" phase's action buttons are visible. */
async function sendAndResolve(
  user: ReturnType<typeof userEvent.setup>,
  responseText: string,
  prompt = "hi",
) {
  let resolveCompletion: (meta: CompletionMeta) => void = () => {};
  mocked.completeStreaming.mockImplementationOnce((_prompt, _modelId, onEvent) => {
    onEvent({ type: "chunk", text: responseText });
    return new Promise<CompletionMeta>((resolve) => {
      resolveCompletion = resolve;
    });
  });
  await user.type(screen.getByLabelText("Ask the assistant"), prompt);
  await user.click(screen.getByRole("button", { name: "Send" }));
  await act(async () => {
    resolveCompletion({ conversationId: "c1", streamId: "s1", messageId: "m1" });
    await Promise.resolve();
  });
  await screen.findByRole("button", { name: "Apply to an entry" });
}

afterEach(() => {
  vi.clearAllMocks();
  useProjectStore.setState(initialStoreState, true);
});

describe("AssistantPanel", () => {
  it("shows a message and a Settings link when no model is configured for this project", () => {
    seedProject({ modelId: undefined });

    renderPanel();

    expect(screen.getByText("No model is chosen for this project yet.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Go to Settings" })).toBeTruthy();
  });

  it("disables Send until a prompt is typed", () => {
    seedProject();

    renderPanel();

    expect(screen.getByRole("button", { name: "Send" })).toHaveProperty("disabled", true);
  });

  it("sends the typed prompt enriched with this step's coaching content, together with the chosen model id (P-59)", async () => {
    const user = userEvent.setup();
    seedProject({ modelId: "openai/gpt-4o" });
    mocked.completeStreaming.mockImplementationOnce(pendingCompletion);

    renderPanel(1);
    await user.type(screen.getByLabelText("Ask the assistant"), "What is 5 Why?");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(mocked.completeStreaming).toHaveBeenCalledWith(
      expect.any(String),
      "openai/gpt-4o",
      expect.any(Function),
      null,
    );
    const [sentPrompt] = mocked.completeStreaming.mock.calls[0]!;
    expect(sentPrompt).toContain("What is 5 Why?");
    expect(sentPrompt).toContain(getCoachingMarkdown("en", 1).trim());
  });

  it("streams chunks into the response area as they arrive, and shows a Cancel button", async () => {
    const user = userEvent.setup();
    seedProject();
    let capturedOnEvent: ((event: StreamEvent) => void) | undefined;
    mocked.completeStreaming.mockImplementationOnce((_prompt, _modelId, onEvent) => {
      capturedOnEvent = onEvent;
      return pendingCompletion();
    });

    renderPanel();
    await user.type(screen.getByLabelText("Ask the assistant"), "hi");
    await user.click(screen.getByRole("button", { name: "Send" }));
    act(() => {
      capturedOnEvent?.({ type: "started", conversationId: "c1", streamId: "s1" });
      capturedOnEvent?.({ type: "chunk", text: "Hello" });
      capturedOnEvent?.({ type: "chunk", text: " there" });
    });

    expect(screen.getByText("Hello there")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeTruthy();
  });

  it("cancelling calls cancelCompletion with the ids captured off the started event", async () => {
    const user = userEvent.setup();
    seedProject();
    let capturedOnEvent: ((event: StreamEvent) => void) | undefined;
    mocked.completeStreaming.mockImplementationOnce((_prompt, _modelId, onEvent) => {
      capturedOnEvent = onEvent;
      return pendingCompletion();
    });
    mocked.cancelCompletion.mockResolvedValueOnce({
      success: true,
      message: "Prediction cancelled",
      partialResponseSaved: false,
    });

    renderPanel();
    await user.type(screen.getByLabelText("Ask the assistant"), "hi");
    await user.click(screen.getByRole("button", { name: "Send" }));
    act(() => capturedOnEvent?.({ type: "started", conversationId: "c1", streamId: "s1" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(mocked.cancelCompletion).toHaveBeenCalledWith("c1", "s1");
  });

  it("shows an editable response plus three actions once the stream completes (D-247)", async () => {
    const user = userEvent.setup();
    seedProject();

    renderPanel();
    await sendAndResolve(user, "The answer");

    expect(screen.getByLabelText("Response")).toHaveProperty("value", "The answer");
    expect(screen.getByRole("button", { name: "Apply to an entry" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add as a new note" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reject" })).toBeTruthy();
  });

  it("Add as a new note writes a generic-text entry with ai-accepted provenance (D-15/D-18)", async () => {
    const user = userEvent.setup();
    seedProject();

    renderPanel();
    await sendAndResolve(user, "The answer");
    await user.click(screen.getByRole("button", { name: "Add as a new note" }));

    const entries = useProjectStore.getState().project?.steps[1]?.entries ?? [];
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      methodId: GENERIC_TEXT_METHOD_ID,
      // The original prompt becomes the title, the response the body — a
      // Q&A pair, not a title that's just a copy of its own body.
      title: "hi",
      payload: { text: "The answer" },
      provenance: {
        origin: "ai-accepted",
        model: { providerId: "vorion", modelId: "openai/gpt-4o", promptVersion: "bare-chat-v1" },
        acceptedBy: "Ada",
      },
    });
    expect(entries[0]?.provenance.generatedAt).toBeTruthy();
    expect(entries[0]?.provenance.acceptedAt).toBeTruthy();
    // Nothing reaches ProjectModel before this action — the entry only exists post-click.
    expect(screen.queryByRole("button", { name: "Add as a new note" })).toBeNull();
  });

  it("Add as a new note with edited text writes ai-edited provenance instead", async () => {
    const user = userEvent.setup();
    seedProject();

    renderPanel();
    await sendAndResolve(user, "The answer");
    const responseBox = screen.getByLabelText("Response");
    await user.type(responseBox, " — edited by a human");
    await user.click(screen.getByRole("button", { name: "Add as a new note" }));

    const entries = useProjectStore.getState().project?.steps[1]?.entries ?? [];
    expect(entries[0]?.provenance.origin).toBe("ai-edited");
    expect((entries[0]?.payload as { text: string }).text).toBe("The answer — edited by a human");
  });

  it("Reject discards the response without dispatching any command", async () => {
    const user = userEvent.setup();
    seedProject();

    renderPanel();
    await sendAndResolve(user, "The answer");
    await user.click(screen.getByRole("button", { name: "Reject" }));

    expect(useProjectStore.getState().project?.steps[1]?.entries).toHaveLength(0);
    expect(screen.queryByRole("button", { name: "Apply to an entry" })).toBeNull();
    // Back to the prompt box, ready for another question.
    expect(screen.getByLabelText("Ask the assistant")).toBeTruthy();
  });

  it("shows an error message when the stream fails for a real reason", async () => {
    const user = userEvent.setup();
    seedProject();
    mocked.completeStreaming.mockImplementationOnce(() => Promise.reject(new Error("429: quota exceeded")));

    renderPanel();
    await user.type(screen.getByLabelText("Ask the assistant"), "hi");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByRole("alert")).toHaveProperty("textContent", "429: quota exceeded");
  });

  it("a cancelled stream's rejection resets to idle silently, without an error message", async () => {
    const user = userEvent.setup();
    seedProject();
    let capturedOnEvent: ((event: StreamEvent) => void) | undefined;
    let rejectCompletion: (error: Error) => void = () => {};
    mocked.completeStreaming.mockImplementationOnce((_prompt, _modelId, onEvent) => {
      capturedOnEvent = onEvent;
      return new Promise<CompletionMeta>((_resolve, reject) => {
        rejectCompletion = reject;
      });
    });
    mocked.cancelCompletion.mockResolvedValueOnce({
      success: true,
      message: "Prediction cancelled",
      partialResponseSaved: false,
    });

    renderPanel();
    await user.type(screen.getByLabelText("Ask the assistant"), "hi");
    await user.click(screen.getByRole("button", { name: "Send" }));
    act(() => capturedOnEvent?.({ type: "started", conversationId: "c1", streamId: "s1" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await act(async () => {
      rejectCompletion(new Error("stream ended before is_final"));
      await Promise.resolve();
    });

    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByLabelText("Ask the assistant")).toBeTruthy();
  });

  it("D-245: a follow-up question can be sent while the previous response is still awaiting an action", async () => {
    const user = userEvent.setup();
    seedProject();

    renderPanel();
    await sendAndResolve(user, "First answer", "first question");

    mocked.completeStreaming.mockImplementationOnce(pendingCompletion);
    await user.type(screen.getByLabelText("Ask the assistant"), "a follow-up question");
    await user.click(screen.getByRole("button", { name: "Send" }));

    // Both turns are visible at once — the first question's answer was not
    // discarded just because a second question was sent.
    expect(screen.getByText("first question")).toBeTruthy();
    expect(screen.getByText("a follow-up question")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Apply to an entry" })).toHaveLength(1);
  });

  it("D-245: a follow-up's completeStreaming call carries the previous turn's own conversationId", async () => {
    const user = userEvent.setup();
    seedProject();

    renderPanel();
    await sendAndResolve(user, "First answer", "first question");

    mocked.completeStreaming.mockImplementationOnce(pendingCompletion);
    await user.type(screen.getByLabelText("Ask the assistant"), "follow-up");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(mocked.completeStreaming).toHaveBeenLastCalledWith(expect.any(String), "openai/gpt-4o", expect.any(Function), "c1");
  });

  it("D-245: resolving one turn (Add as a new note) leaves a later, still-pending turn untouched", async () => {
    const user = userEvent.setup();
    seedProject();

    renderPanel();
    await sendAndResolve(user, "First answer", "first question");

    let resolveSecond: (meta: CompletionMeta) => void = () => {};
    mocked.completeStreaming.mockImplementationOnce((_prompt, _modelId, onEvent) => {
      onEvent({ type: "chunk", text: "Second answer" });
      return new Promise<CompletionMeta>((resolve) => {
        resolveSecond = resolve;
      });
    });
    await user.type(screen.getByLabelText("Ask the assistant"), "second question");
    await user.click(screen.getByRole("button", { name: "Send" }));
    await act(async () => {
      resolveSecond({ conversationId: "c1", streamId: "s2", messageId: "m2" });
      await Promise.resolve();
    });

    const [firstAddAsNote] = screen.getAllByRole("button", { name: "Add as a new note" });
    await user.click(firstAddAsNote!);

    expect(useProjectStore.getState().project?.steps[1]?.entries).toHaveLength(1);
    // The first turn now shows as resolved history; the second is still
    // awaiting its own action, completely unaffected by the first.
    expect(screen.getByText("Added as a new note")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Apply to an entry" })).toBeTruthy();
    expect(screen.getByLabelText("Response")).toHaveProperty("value", "Second answer");
  });

  describe("D-247: Apply to an entry", () => {
    it("identifies a target entry and shows a review using that entry's own plugin Editor", async () => {
      const user = userEvent.setup();
      const existing = makeEntry({ id: "entry-1", title: "Old title", payload: { text: "old body" } });
      seedProject({}, [existing]);
      mockedChatEntryEdit.identifySuggestionTargetEntry.mockResolvedValueOnce({
        outcome: "matched",
        targetEntryId: "entry-1",
      });
      mockedChatEntryEdit.proposeEntryEditFromSuggestion.mockResolvedValueOnce({
        outcome: "success",
        title: "New title",
        payload: { text: "New body" },
      });

      renderPanel();
      await sendAndResolve(user, "You should update the old entry.");
      await user.click(screen.getByRole("button", { name: "Apply to an entry" }));

      expect(await screen.findByRole("button", { name: "Apply this change" })).toBeTruthy();
      expect(screen.getByLabelText("Entry title")).toHaveProperty("value", "New title");
      expect(screen.getByLabelText("Text")).toHaveProperty("value", "New body");
    });

    it("passes the step's real entries and the chosen model to identifySuggestionTargetEntry", async () => {
      const user = userEvent.setup();
      const existing = makeEntry({ id: "entry-1" });
      seedProject({}, [existing]);
      mockedChatEntryEdit.identifySuggestionTargetEntry.mockResolvedValueOnce({ outcome: "noMatch" });

      renderPanel();
      await sendAndResolve(user, "A suggestion.");
      await user.click(screen.getByRole("button", { name: "Apply to an entry" }));
      await screen.findByText("This suggestion doesn't seem to target one specific existing entry.");

      expect(mockedChatEntryEdit.identifySuggestionTargetEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          suggestionText: "A suggestion.",
          entries: [existing],
          modelId: "openai/gpt-4o",
        }),
      );
    });

    it("Apply this change dispatches a real entry update and marks the turn resolved", async () => {
      const user = userEvent.setup();
      const existing = makeEntry({ id: "entry-1", title: "Old title", payload: { text: "old body" } });
      seedProject({}, [existing]);
      mockedChatEntryEdit.identifySuggestionTargetEntry.mockResolvedValueOnce({
        outcome: "matched",
        targetEntryId: "entry-1",
      });
      mockedChatEntryEdit.proposeEntryEditFromSuggestion.mockResolvedValueOnce({
        outcome: "success",
        title: "New title",
        payload: { text: "New body" },
      });

      renderPanel();
      await sendAndResolve(user, "You should update the old entry.");
      await user.click(screen.getByRole("button", { name: "Apply to an entry" }));
      await user.click(await screen.findByRole("button", { name: "Apply this change" }));

      const entries = useProjectStore.getState().project?.steps[1]?.entries ?? [];
      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({
        id: "entry-1",
        title: "New title",
        payload: { text: "New body" },
        provenance: { origin: "ai-accepted" },
      });
      expect(screen.getByText("Applied to entry")).toBeTruthy();
    });

    it("shows a no-match message, with a way back, when the suggestion targets no existing entry", async () => {
      const user = userEvent.setup();
      seedProject({}, [makeEntry()]);
      mockedChatEntryEdit.identifySuggestionTargetEntry.mockResolvedValueOnce({ outcome: "noMatch" });

      renderPanel();
      await sendAndResolve(user, "A general comment, not about any one entry.");
      await user.click(screen.getByRole("button", { name: "Apply to an entry" }));

      expect(await screen.findByText("This suggestion doesn't seem to target one specific existing entry.")).toBeTruthy();
      await user.click(screen.getByRole("button", { name: "Back" }));

      expect(screen.getByRole("button", { name: "Apply to an entry" })).toBeTruthy();
      expect(screen.getByRole("button", { name: "Add as a new note" })).toBeTruthy();
    });

    it("shows a failure message when the structured edit proposal fails", async () => {
      const user = userEvent.setup();
      seedProject({}, [makeEntry({ id: "entry-1" })]);
      mockedChatEntryEdit.identifySuggestionTargetEntry.mockResolvedValueOnce({
        outcome: "matched",
        targetEntryId: "entry-1",
      });
      mockedChatEntryEdit.proposeEntryEditFromSuggestion.mockResolvedValueOnce({
        outcome: "failed",
        rawText: "not valid json",
      });

      renderPanel();
      await sendAndResolve(user, "Update this entry.");
      await user.click(screen.getByRole("button", { name: "Apply to an entry" }));

      expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Couldn't work out a valid change for that entry.");
      expect(screen.getByText("not valid json")).toBeTruthy();
      expect(useProjectStore.getState().project?.steps[1]?.entries).toHaveLength(1);
    });

    it("rejecting the review returns to the default actions without writing anything", async () => {
      const user = userEvent.setup();
      const existing = makeEntry({ id: "entry-1" });
      seedProject({}, [existing]);
      mockedChatEntryEdit.identifySuggestionTargetEntry.mockResolvedValueOnce({
        outcome: "matched",
        targetEntryId: "entry-1",
      });
      mockedChatEntryEdit.proposeEntryEditFromSuggestion.mockResolvedValueOnce({
        outcome: "success",
        title: "New title",
        payload: { text: "New body" },
      });

      renderPanel();
      await sendAndResolve(user, "Update this entry.");
      await user.click(screen.getByRole("button", { name: "Apply to an entry" }));
      await screen.findByRole("button", { name: "Apply this change" });
      const rejectButtons = screen.getAllByRole("button", { name: "Reject" });
      await user.click(rejectButtons[rejectButtons.length - 1]!);

      expect(screen.getByRole("button", { name: "Apply to an entry" })).toBeTruthy();
      expect(useProjectStore.getState().project?.steps[1]?.entries).toEqual([existing]);
    });
  });
});
