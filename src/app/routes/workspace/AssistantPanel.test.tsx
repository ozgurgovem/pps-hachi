import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import "../../../i18n";
import { createNewProject } from "../../../domain/model";
import type { AiMeta, ProjectModel } from "../../../domain/model";
import { GENERIC_TEXT_METHOD_ID } from "../../../methods/genericText";
import { useProjectStore } from "../../../state";
import { AssistantPanel } from "./AssistantPanel";
import * as completionIpc from "../../../ai/completionIpc";
import type { CompletionMeta, StreamEvent } from "../../../ai/completionIpc";

vi.mock("../../../ai/completionIpc");

const mocked = vi.mocked(completionIpc);
const initialStoreState = useProjectStore.getState();

function seedProject(aiOverrides: Partial<AiMeta> = {}): ProjectModel {
  const { project } = createNewProject({ title: "T", language: "en", appVersion: "0.1.0" });
  const withAi: ProjectModel = {
    ...project,
    meta: {
      ...project.meta,
      owner: { name: "Ada" },
      ai: { enabled: true, providerId: "vorion", modelId: "openai/gpt-4o", redaction: {}, ...aiOverrides },
    },
  };
  // W1/D-218: `activeStepId` now starts `null` (the landing view) — these
  // tests exercise Accept, which needs a real active step, so seed one
  // explicitly rather than relying on a default that no longer holds.
  useProjectStore.setState({ ...initialStoreState, project: withAi, activeStepId: 1 });
  return withAi;
}

function renderPanel() {
  return render(
    <MemoryRouter>
      <AssistantPanel />
    </MemoryRouter>,
  );
}

/** Never resolves — enough for tests that only exercise the streaming phase. */
function pendingCompletion() {
  return new Promise<CompletionMeta>(() => {});
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

  it("sends the typed prompt together with the project's chosen model id", async () => {
    const user = userEvent.setup();
    seedProject({ modelId: "openai/gpt-4o" });
    mocked.completeStreaming.mockImplementationOnce(pendingCompletion);

    renderPanel();
    await user.type(screen.getByLabelText("Ask the assistant"), "What is 5 Why?");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(mocked.completeStreaming).toHaveBeenCalledWith("What is 5 Why?", "openai/gpt-4o", expect.any(Function));
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

  it("shows an editable response plus Accept/Reject once the stream completes", async () => {
    const user = userEvent.setup();
    seedProject();
    let resolveCompletion: (meta: CompletionMeta) => void = () => {};
    mocked.completeStreaming.mockImplementationOnce((_prompt, _modelId, onEvent) => {
      onEvent({ type: "chunk", text: "The answer" });
      return new Promise<CompletionMeta>((resolve) => {
        resolveCompletion = resolve;
      });
    });

    renderPanel();
    await user.type(screen.getByLabelText("Ask the assistant"), "hi");
    await user.click(screen.getByRole("button", { name: "Send" }));
    await act(async () => {
      resolveCompletion({ conversationId: "c1", streamId: "s1", messageId: "m1" });
      await Promise.resolve();
    });

    expect(await screen.findByRole("button", { name: "Accept" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reject" })).toBeTruthy();
    expect(screen.getByLabelText("Response")).toHaveProperty("value", "The answer");
  });

  it("accepting an unedited response writes a generic-text entry with ai-accepted provenance (D-15/D-18)", async () => {
    const user = userEvent.setup();
    seedProject();
    let resolveCompletion: (meta: CompletionMeta) => void = () => {};
    mocked.completeStreaming.mockImplementationOnce((_prompt, _modelId, onEvent) => {
      onEvent({ type: "chunk", text: "The answer" });
      return new Promise<CompletionMeta>((resolve) => {
        resolveCompletion = resolve;
      });
    });

    renderPanel();
    await user.type(screen.getByLabelText("Ask the assistant"), "hi");
    await user.click(screen.getByRole("button", { name: "Send" }));
    await act(async () => {
      resolveCompletion({ conversationId: "c1", streamId: "s1", messageId: "m1" });
      await Promise.resolve();
    });
    await user.click(await screen.findByRole("button", { name: "Accept" }));

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
    // Nothing reaches ProjectModel before Accept — the entry only exists post-click.
    expect(screen.queryByRole("button", { name: "Accept" })).toBeNull();
  });

  it("accepting an edited response writes ai-edited provenance instead", async () => {
    const user = userEvent.setup();
    seedProject();
    let resolveCompletion: (meta: CompletionMeta) => void = () => {};
    mocked.completeStreaming.mockImplementationOnce((_prompt, _modelId, onEvent) => {
      onEvent({ type: "chunk", text: "The answer" });
      return new Promise<CompletionMeta>((resolve) => {
        resolveCompletion = resolve;
      });
    });

    renderPanel();
    await user.type(screen.getByLabelText("Ask the assistant"), "hi");
    await user.click(screen.getByRole("button", { name: "Send" }));
    await act(async () => {
      resolveCompletion({ conversationId: "c1", streamId: "s1", messageId: "m1" });
      await Promise.resolve();
    });
    const responseBox = await screen.findByLabelText("Response");
    await user.type(responseBox, " — edited by a human");
    await user.click(screen.getByRole("button", { name: "Accept" }));

    const entries = useProjectStore.getState().project?.steps[1]?.entries ?? [];
    expect(entries[0]?.provenance.origin).toBe("ai-edited");
    expect((entries[0]?.payload as { text: string }).text).toBe("The answer — edited by a human");
  });

  it("rejecting discards the response without dispatching any command", async () => {
    const user = userEvent.setup();
    seedProject();
    let resolveCompletion: (meta: CompletionMeta) => void = () => {};
    mocked.completeStreaming.mockImplementationOnce((_prompt, _modelId, onEvent) => {
      onEvent({ type: "chunk", text: "The answer" });
      return new Promise<CompletionMeta>((resolve) => {
        resolveCompletion = resolve;
      });
    });

    renderPanel();
    await user.type(screen.getByLabelText("Ask the assistant"), "hi");
    await user.click(screen.getByRole("button", { name: "Send" }));
    await act(async () => {
      resolveCompletion({ conversationId: "c1", streamId: "s1", messageId: "m1" });
      await Promise.resolve();
    });
    await user.click(await screen.findByRole("button", { name: "Reject" }));

    expect(useProjectStore.getState().project?.steps[1]?.entries).toHaveLength(0);
    expect(screen.queryByRole("button", { name: "Accept" })).toBeNull();
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
});
