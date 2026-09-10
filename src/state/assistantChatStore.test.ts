import { beforeEach, describe, expect, it } from "vitest";
import { selectStepChat, useAssistantChatStore } from "./assistantChatStore";
import type { Turn } from "./assistantChatStore";

const doneTurn: Turn = {
  id: "t1",
  phase: "done",
  prompt: "hi",
  originalText: "hello",
  editedText: "hello",
  meta: { conversationId: "c1", streamId: "s1", messageId: "m1" },
  generatedAt: "2026-01-01T00:00:00.000Z",
};

const initialState = useAssistantChatStore.getState();

beforeEach(() => {
  useAssistantChatStore.setState(initialState, true);
});

describe("useAssistantChatStore", () => {
  it("starts with no chat for any step", () => {
    expect(selectStepChat(1)(useAssistantChatStore.getState())).toEqual({
      promptText: "",
      turns: [],
      lastConversationId: null,
    });
  });

  it("keeps a step's turns/promptText/lastConversationId set independently of other steps", () => {
    useAssistantChatStore.getState().syncProject("p1");
    useAssistantChatStore.getState().setTurns(1, () => [doneTurn]);
    useAssistantChatStore.getState().setPromptText(1, "draft");
    useAssistantChatStore.getState().setLastConversationId(1, "c1");

    expect(selectStepChat(1)(useAssistantChatStore.getState())).toEqual({
      promptText: "draft",
      turns: [doneTurn],
      lastConversationId: "c1",
    });
    // A different step's chat is untouched — and reading it doesn't even
    // allocate a new entry in `chatsByStep` (the selector's own default).
    expect(selectStepChat(2)(useAssistantChatStore.getState())).toEqual({
      promptText: "",
      turns: [],
      lastConversationId: null,
    });
  });

  // D-251: the one real correctness risk this store's own existence outside
  // the component tree introduces — a stale conversation from a previously
  // open project must never bleed into a newly opened one.
  it("syncProject clears every step's chat when the project id actually changes", () => {
    useAssistantChatStore.getState().syncProject("project-a");
    useAssistantChatStore.getState().setTurns(3, () => [doneTurn]);
    expect(selectStepChat(3)(useAssistantChatStore.getState()).turns).toEqual([doneTurn]);

    useAssistantChatStore.getState().syncProject("project-b");

    expect(selectStepChat(3)(useAssistantChatStore.getState())).toEqual({
      promptText: "",
      turns: [],
      lastConversationId: null,
    });
  });

  it("syncProject is a no-op when the project id hasn't changed — a real conversation is preserved", () => {
    useAssistantChatStore.getState().syncProject("project-a");
    useAssistantChatStore.getState().setTurns(3, () => [doneTurn]);

    useAssistantChatStore.getState().syncProject("project-a");

    expect(selectStepChat(3)(useAssistantChatStore.getState()).turns).toEqual([doneTurn]);
  });
});
