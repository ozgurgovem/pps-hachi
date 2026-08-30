use serde::{Deserialize, Serialize};

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

/// SPEC.md §8.2's provider abstraction, sized to the single Vorion adapter
/// D-199 / this dilim's §2.2 settled on rather than the three-provider
/// draft. `complete()` (Streaming Prediction → a Tauri `Channel`) is Dilim
/// 2's job to call from the UI; it isn't declared here yet — adding it later
/// is additive to this trait, not a change to what Dilim 1 ships.
pub trait LlmProvider {
    async fn list_models(&self) -> Result<Vec<ModelInfo>, AiError>;
    async fn test_connection(&self, model_id: &str) -> Result<ConnectionStatus, AiError>;
}
