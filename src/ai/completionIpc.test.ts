import { describe, expect, test, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { cancelCompletion, completeStreaming, type StreamEvent } from "./completionIpc";

/** A minimal stand-in for Tauri's real `Channel` — just enough surface
 * (`onmessage` settable, invoked by the test) for `completeStreaming` to
 * drive real event delivery through, without a Tauri runtime. */
class MockChannel {
  onmessage: (event: unknown) => void = () => {};
}

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
  Channel: vi.fn().mockImplementation(() => new MockChannel()),
}));

const mockInvoke = vi.mocked(invoke);

describe("completionIpc", () => {
  test("completeStreaming invokes ai_complete with prompt/modelId and a channel", async () => {
    mockInvoke.mockResolvedValueOnce({ conversationId: "c1", streamId: "s1", messageId: "m1" });

    await completeStreaming("hello", "openai/gpt-4o", () => {});

    expect(mockInvoke).toHaveBeenCalledWith(
      "ai_complete",
      expect.objectContaining({ prompt: "hello", modelId: "openai/gpt-4o" }),
    );
  });

  test("completeStreaming sends conversationId: null when not continuing a thread", async () => {
    mockInvoke.mockResolvedValueOnce({ conversationId: "c1", streamId: "s1", messageId: "m1" });

    await completeStreaming("hello", "openai/gpt-4o", () => {});

    expect(mockInvoke).toHaveBeenCalledWith("ai_complete", expect.objectContaining({ conversationId: null }));
  });

  test("completeStreaming forwards a given conversationId to continue a thread server-side (D-245)", async () => {
    mockInvoke.mockResolvedValueOnce({ conversationId: "c1", streamId: "s1", messageId: "m1" });

    await completeStreaming("follow-up", "openai/gpt-4o", () => {}, "c1");

    expect(mockInvoke).toHaveBeenCalledWith("ai_complete", expect.objectContaining({ conversationId: "c1" }));
  });

  test("completeStreaming resolves with the final CompletionMeta", async () => {
    mockInvoke.mockResolvedValueOnce({ conversationId: "c1", streamId: "s1", messageId: "m1" });

    const result = await completeStreaming("hello", "vorion", () => {});

    expect(result).toEqual({ conversationId: "c1", streamId: "s1", messageId: "m1" });
  });

  test("completeStreaming forwards every channel message to onEvent, in order, before resolving", async () => {
    mockInvoke.mockImplementationOnce(async (_cmd, args) => {
      const { channel } = args as { channel: MockChannel };
      channel.onmessage({ type: "started", conversationId: "c1", streamId: "s1" });
      channel.onmessage({ type: "chunk", text: "Hello" });
      channel.onmessage({ type: "chunk", text: " world" });
      const meta = { conversationId: "c1", streamId: "s1", messageId: "m1" };
      channel.onmessage({ type: "done", meta });
      return meta;
    });

    const events: StreamEvent[] = [];
    const result = await completeStreaming("hi", "vorion", (event) => events.push(event));

    expect(events).toEqual([
      { type: "started", conversationId: "c1", streamId: "s1" },
      { type: "chunk", text: "Hello" },
      { type: "chunk", text: " world" },
      { type: "done", meta: { conversationId: "c1", streamId: "s1", messageId: "m1" } },
    ]);
    expect(result).toEqual({ conversationId: "c1", streamId: "s1", messageId: "m1" });
  });

  test("cancelCompletion invokes ai_cancel with conversationId/streamId", async () => {
    mockInvoke.mockResolvedValueOnce({ success: true, message: "Prediction cancelled", partialResponseSaved: false });

    const result = await cancelCompletion("c1", "s1");

    expect(mockInvoke).toHaveBeenCalledWith("ai_cancel", { conversationId: "c1", streamId: "s1" });
    expect(result).toEqual({ success: true, message: "Prediction cancelled", partialResponseSaved: false });
  });

  test("cancelCompletion accepts a null streamId (cancels the conversation's latest active stream)", async () => {
    mockInvoke.mockResolvedValueOnce({ success: true, message: "Prediction cancelled", partialResponseSaved: false });

    await cancelCompletion("c1", null);

    expect(mockInvoke).toHaveBeenCalledWith("ai_cancel", { conversationId: "c1", streamId: null });
  });
});
