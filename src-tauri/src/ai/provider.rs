use serde::{Deserialize, Serialize};
use tauri::ipc::Channel;

use super::error::AiError;

/// One entry in a model selector — provider-agnostic on the Rust→TS boundary
/// even though today there is exactly one adapter (Vorion, D-199). `id` is
/// what the frontend persists (the settings file's `defaultModelId`/
/// `fastModelId`) and later passes back into `test_connection` —
/// `VorionProvider`'s own `"{llm_name}/{llm_group_name}"` shape (D-200),
/// built from the real `GET /llm/api/v1/llms` response's `provider_name`/
/// `group_name` fields, confirmed against the real docs, never guessed.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ModelInfo {
    pub id: String,
    pub name: String,
    pub provider: String,
}

/// SPEC.md §8.3: "Test connection" reports latency and any billing/quota
/// error verbatim — never throws for a provider-side or network failure
/// (see `VorionProvider::test_connection`), only for something wrong on our
/// own side.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionStatus {
    pub success: bool,
    pub latency_ms: u64,
    pub error: Option<String>,
}

/// D-199 Q3 (§2.4 of `faz8-dilim2-vorion-streaming.md`): the bare chat box
/// has no step context, no mode selector, no schema — free text in, free
/// text streamed back out. `model_id` is the same `"{llm_name}/
/// {llm_group_name}"` shape `test_connection`/`ModelInfo::id` already use.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompletionRequest {
    pub prompt: String,
    pub model_id: String,
}

/// What crosses the Tauri `Channel` as a Streaming Prediction progresses —
/// deliberately smaller than Vorion's own per-chunk schema (D-201: confirmed
/// against the real `vorionai.com/docs` "Streaming Prediction (SSE)"
/// reference, Barış's authenticated session, 2026-08-31). `tool_progress`/
/// `rag_sources` are never surfaced here: this app never sends `tool_ids`/
/// `mcp_server_ids`/`knowledge_base_ids` (D-15/D-16's Agent/RAG boundary),
/// so Vorion never populates either field for a request this adapter sends.
///
/// `Started` fires once, from the very first SSE frame — Vorion's own docs:
/// `conversation_id` is on every frame, `stream_id` is set "on the first
/// chunk". The UI needs both *before* the response finishes to let a user
/// cancel mid-stream (Cancel Prediction takes exactly these two ids), so
/// they cannot wait for `Done`.
#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum StreamEvent {
    Started {
        conversation_id: String,
        stream_id: Option<String>,
    },
    Chunk {
        text: String,
    },
    Done {
        meta: CompletionMeta,
    },
    Error {
        message: String,
    },
}

/// D-201: Vorion's own Streaming Prediction response carries no token counts
/// anywhere (unlike Synchronous Prediction) — confirmed by reading the real
/// response schema, not an omission on this app's side. Cost/token tracking
/// is §8.12, explicitly Faz 9/10 (see this dilim's own §3 kapsam dışı list),
/// so `CompletionMeta` simply has nothing to carry yet.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CompletionMeta {
    pub conversation_id: String,
    pub stream_id: Option<String>,
    pub message_id: Option<String>,
}

/// Mirrors Vorion's real Cancel Prediction response — only the three fields
/// this app actually reads out of it (`conversation_id`/`stream_id` are the
/// caller's own echoed input, not read back).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CancelResult {
    pub success: bool,
    pub message: String,
    pub partial_response_saved: bool,
}

/// SPEC.md §8.2's provider abstraction, sized to the single Vorion adapter
/// D-199 / this dilim's §2.2 settled on rather than the three-provider
/// draft.
pub trait LlmProvider {
    async fn list_models(&self) -> Result<Vec<ModelInfo>, AiError>;
    async fn test_connection(&self, model_id: &str) -> Result<ConnectionStatus, AiError>;

    /// Streams a Vorion Streaming Prediction over `tx`, one `StreamEvent`
    /// per SSE frame, and resolves once a final (`is_final: true`) frame
    /// has arrived. SPEC.md §8.14 "Stream interrupted mid-response → partial
    /// content is discarded, not half-written into a proposal": if the
    /// connection ends before a final frame, this returns `Err` rather than
    /// a `CompletionMeta` — there is no such thing as a partial success here.
    async fn complete(
        &self,
        req: CompletionRequest,
        tx: Channel<StreamEvent>,
    ) -> Result<CompletionMeta, AiError>;

    /// Cancel Prediction. `stream_id` is optional in Vorion's own API
    /// ("omitted, cancels the latest active stream for the conversation")
    /// but this app always has one by the time a Cancel button is even
    /// shown — it only appears after the first `StreamEvent::Done`-bearing
    /// `stream_id` (or an earlier chunk) has been captured by the caller.
    async fn cancel(
        &self,
        conversation_id: &str,
        stream_id: Option<&str>,
    ) -> Result<CancelResult, AiError>;
}
