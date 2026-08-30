import { Channel, invoke } from "@tauri-apps/api/core";

/** Mirrors `src-tauri/src/ai/provider.rs::CompletionMeta`. */
export interface CompletionMeta {
  conversationId: string;
  streamId: string | null;
  messageId: string | null;
}

/** Mirrors `src-tauri/src/ai/provider.rs::CancelResult`. */
export interface CancelResult {
  success: boolean;
  message: string;
  partialResponseSaved: boolean;
}

/**
 * Mirrors `src-tauri/src/ai/provider.rs::StreamEvent` (D-201). `started`
 * fires once, before the first `chunk` — it carries the two ids Cancel
 * Prediction needs, which the caller must capture before the stream ends if
 * it ever wants to interrupt it.
 */
export type StreamEvent =
  | { type: "started"; conversationId: string; streamId: string | null }
  | { type: "chunk"; text: string }
  | { type: "done"; meta: CompletionMeta }
  | { type: "error"; message: string };

/**
 * D-201: Streaming Prediction → Tauri `Channel` → `onEvent`. Mirrors
 * `VorionProvider::complete`'s own shape — the returned promise resolves
 * once the whole stream completes (or rejects, per SPEC.md §8.14's "partial
 * content is discarded, not half-written into a proposal"); `onEvent` is how
 * the caller sees progress before that.
 */
export function completeStreaming(
  prompt: string,
  modelId: string,
  onEvent: (event: StreamEvent) => void,
): Promise<CompletionMeta> {
  const channel = new Channel<StreamEvent>();
  channel.onmessage = onEvent;
  return invoke<CompletionMeta>("ai_complete", { prompt, modelId, channel });
}

/** SPEC.md §8.14 "Stream interrupted mid-response" — call with the ids captured off `StreamEvent`'s `started` event. */
export function cancelCompletion(conversationId: string, streamId: string | null): Promise<CancelResult> {
  return invoke<CancelResult>("ai_cancel", { conversationId, streamId });
}
