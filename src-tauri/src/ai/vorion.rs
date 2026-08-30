use serde::{Deserialize, Serialize};
use std::time::Instant;

use super::error::AiError;
use super::provider::{ConnectionStatus, LlmProvider, ModelInfo};

/// Confirmed against the real `vorionai.com/docs` "Synchronous Prediction"
/// reference (Barış's authenticated session, 2026-08-30) — not assumed. The
/// full path nests one level deeper than D-199's own note: `/api/<service>`
/// is followed by `/api/v1/<resource>`, e.g.
/// `https://vorionai.com/api/llm/api/v1/prediction/predict`.
const BASE_URL: &str = "https://vorionai.com/api/llm/api/v1";

/// Trivial, deterministic prompt for "Test connection" — SPEC.md §8.3's own
/// "smallest possible real request." Never surfaced to the user; only
/// success/failure/latency are (`ConnectionStatus`).
const TEST_CONNECTION_PROMPT: &str = "Reply with exactly one word: OK.";

/// D-200: a model id as this app persists it is `"{llm_name}/{llm_group_name}"`
/// (e.g. `"openai/gpt-4o"`), or bare `llm_name` alone (e.g. `"vorion"`) when
/// there is no group — `ModelInfo::id`'s own shape, set by
/// `VorionProvider::list_models` once that lands. Splitting it back apart is
/// the inverse of building it, kept next to the one request that needs it.
fn split_model_id(model_id: &str) -> (String, Option<String>) {
    match model_id.split_once('/') {
        Some((llm_name, llm_group_name)) => {
            (llm_name.to_string(), Some(llm_group_name.to_string()))
        }
        None => (model_id.to_string(), None),
    }
}

/// Only the request fields this dilim actually needs. Every other documented
/// field (`rag_config.*`, `thinking.*`, `tool_ids`, `mcp_server_ids`,
/// `agent_id`, `execution_id`, `execution_metadata.*`, `knowledge_base_ids`,
/// `file_ids`, …) is deliberately never set — several of those are exactly
/// Vorion's Agent/RAG-service surface D-199 draws a hard line against this
/// app ever touching (D-15/D-16), and the rest have server-side defaults a
/// trivial connectivity check has no reason to override.
#[derive(Debug, Serialize)]
struct PredictionPrompt {
    text: String,
}

#[derive(Debug, Serialize)]
struct PredictionRequest {
    prompt: PredictionPrompt,
    llm_name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    llm_group_name: Option<String>,
}

/// Only the fields this adapter actually reads from `GET /llm/api/v1/llms` —
/// confirmed against the real "List LLMs" reference (Barış's authenticated
/// session, 2026-08-30). `group_name` is exactly the value the Synchronous
/// Prediction request calls `llm_group_name` — the docs' own worked example
/// requests `group_name: "gpt-4o"` as `"llm_group_name": "gpt-4o"`.
#[derive(Debug, Deserialize)]
struct LlmListItem {
    provider_name: String,
    model_name: String,
    group_name: String,
    #[serde(default)]
    display_name: Option<String>,
}

#[derive(Debug, Deserialize)]
struct ListLlmsResponse {
    items: Vec<LlmListItem>,
}

fn model_info_from_item(item: LlmListItem) -> ModelInfo {
    ModelInfo {
        id: format!("{}/{}", item.provider_name, item.group_name),
        name: item.display_name.unwrap_or(item.model_name),
        provider: item.provider_name,
    }
}

pub struct VorionProvider {
    api_key: String,
    http: reqwest::Client,
}

impl VorionProvider {
    pub fn new(api_key: String) -> Self {
        Self {
            api_key,
            http: reqwest::Client::new(),
        }
    }
}

impl LlmProvider for VorionProvider {
    /// D-21: never hardcoded — fetched live from Vorion's own LLM
    /// Configuration endpoint every time the caller asks (no client-side
    /// cache yet; SPEC.md §8.2's 24h-cache note is a later-phase
    /// optimization, not this dilim's done-criterion). `available_only=true`
    /// and a generous `page_size` are passed explicitly rather than relying
    /// on the endpoint's own default of the same value — explicit survives a
    /// future server-side default change; pagination beyond the first page
    /// is a known, documented simplification for this dilim.
    async fn list_models(&self) -> Result<Vec<ModelInfo>, AiError> {
        let response: ListLlmsResponse = self
            .http
            .get(format!("{BASE_URL}/llms?available_only=true&page_size=100"))
            .header("x-api-key", &self.api_key)
            .send()
            .await?
            .json()
            .await?;

        Ok(response
            .items
            .into_iter()
            .map(model_info_from_item)
            .collect())
    }

    /// SPEC.md §8.3: "the smallest possible real request... reports
    /// latency... and any billing/quota error verbatim." Never returns `Err`
    /// for a provider-side or network failure — those become
    /// `ConnectionStatus { success: false, error: Some(...) }` so the caller
    /// always has a latency figure and a message to show, matching how a
    /// human actually uses this button. `Err` is reserved for a failure on
    /// our own side (today: none are reachable — building this request
    /// cannot fail — but the signature stays honest about the possibility).
    async fn test_connection(&self, model_id: &str) -> Result<ConnectionStatus, AiError> {
        let (llm_name, llm_group_name) = split_model_id(model_id);
        let request = PredictionRequest {
            prompt: PredictionPrompt {
                text: TEST_CONNECTION_PROMPT.to_string(),
            },
            llm_name,
            llm_group_name,
        };
        let data = serde_json::to_string(&request)?;
        let form = reqwest::multipart::Form::new().text("data", data);

        let started = Instant::now();
        let outcome = self
            .http
            .post(format!("{BASE_URL}/prediction/predict"))
            .header("x-api-key", &self.api_key)
            .multipart(form)
            .send()
            .await;
        let latency_ms: u64 = started.elapsed().as_millis().try_into().unwrap_or(u64::MAX);

        Ok(match outcome {
            Ok(response) if response.status().is_success() => ConnectionStatus {
                success: true,
                latency_ms,
                error: None,
            },
            Ok(response) => {
                let status = response.status().as_u16();
                let body = response.text().await.unwrap_or_default();
                ConnectionStatus {
                    success: false,
                    latency_ms,
                    error: Some(format!("{status}: {body}")),
                }
            }
            Err(err) => ConnectionStatus {
                success: false,
                latency_ms,
                error: Some(err.to_string()),
            },
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn split_model_id_separates_llm_name_and_group() {
        assert_eq!(
            split_model_id("openai/gpt-4o"),
            ("openai".to_string(), Some("gpt-4o".to_string()))
        );
    }

    #[test]
    fn split_model_id_treats_a_bare_id_as_llm_name_with_no_group() {
        assert_eq!(split_model_id("vorion"), ("vorion".to_string(), None));
    }

    #[test]
    fn split_model_id_only_splits_on_the_first_slash() {
        assert_eq!(
            split_model_id("azure/gpt-4o/2024-08-06"),
            ("azure".to_string(), Some("gpt-4o/2024-08-06".to_string()))
        );
    }

    #[test]
    fn prediction_request_serializes_with_vorions_exact_snake_case_field_names() {
        let request = PredictionRequest {
            prompt: PredictionPrompt {
                text: "hi".to_string(),
            },
            llm_name: "openai".to_string(),
            llm_group_name: Some("gpt-4o".to_string()),
        };

        let json = serde_json::to_value(&request).unwrap();

        assert_eq!(json["prompt"]["text"], "hi");
        assert_eq!(json["llm_name"], "openai");
        assert_eq!(json["llm_group_name"], "gpt-4o");
    }

    #[test]
    fn prediction_request_omits_llm_group_name_when_absent_rather_than_sending_null() {
        let request = PredictionRequest {
            prompt: PredictionPrompt {
                text: "hi".to_string(),
            },
            llm_name: "vorion".to_string(),
            llm_group_name: None,
        };

        let json = serde_json::to_value(&request).unwrap();

        assert!(!json.as_object().unwrap().contains_key("llm_group_name"));
    }

    #[test]
    fn model_info_from_item_joins_provider_and_group_into_a_slash_separated_id() {
        let item = LlmListItem {
            provider_name: "openai".to_string(),
            model_name: "gpt-4o-2024-08-06".to_string(),
            group_name: "gpt-4o".to_string(),
            display_name: Some("GPT-4o".to_string()),
        };

        let info = model_info_from_item(item);

        assert_eq!(info.id, "openai/gpt-4o");
        assert_eq!(info.name, "GPT-4o");
        assert_eq!(info.provider, "openai");
    }

    #[test]
    fn model_info_from_item_falls_back_to_model_name_when_display_name_is_absent() {
        let item = LlmListItem {
            provider_name: "groq".to_string(),
            model_name: "llama-3.1-8b-instant".to_string(),
            group_name: "llama-3.1-8b".to_string(),
            display_name: None,
        };

        let info = model_info_from_item(item);

        assert_eq!(info.name, "llama-3.1-8b-instant");
    }

    /// Deserializes a realistic response shaped exactly like the real
    /// "List LLMs" reference (Barış's authenticated session, 2026-08-30) —
    /// including the extra fields (`id`, `model_category`, `cost_per_*`,
    /// timestamps, …) this adapter doesn't read, proving the "extra fields
    /// are ignored" assumption rather than only asserting it in a comment.
    #[test]
    fn list_llms_response_deserializes_from_the_real_documented_shape() {
        let body = serde_json::json!({
            "items": [
                {
                    "id": 42,
                    "provider_name": "openai",
                    "model_name": "gpt-4o-2024-08-06",
                    "group_name": "gpt-4o",
                    "model_category": "chat",
                    "display_name": "GPT-4o",
                    "description": "OpenAI's flagship model",
                    "context_window_size": 128000,
                    "max_output_tokens": 16384,
                    "static_weight": 1.0,
                    "config_json": null,
                    "status": "active",
                    "is_available": true,
                    "cost_per_input_token": 0.0000025,
                    "cost_per_output_token": 0.00001,
                    "sort_order": 1,
                    "extra_metadata": null,
                    "created_at": "2026-01-01T00:00:00Z",
                    "updated_at": "2026-01-01T00:00:00Z",
                    "deleted_at": null,
                    "deleted_by": null
                }
            ],
            "total": 1,
            "page": 1,
            "page_size": 100,
            "total_pages": 1
        })
        .to_string();

        let response: ListLlmsResponse = serde_json::from_str(&body).unwrap();
        let models: Vec<ModelInfo> = response
            .items
            .into_iter()
            .map(model_info_from_item)
            .collect();

        assert_eq!(
            models,
            vec![ModelInfo {
                id: "openai/gpt-4o".to_string(),
                name: "GPT-4o".to_string(),
                provider: "openai".to_string(),
            }]
        );
    }
}
