use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use std::time::Instant;
use tauri::ipc::Channel;

use super::error::AiError;
use super::provider::{
    CancelResult, CompletionMeta, CompletionRequest, ConnectionStatus, LlmProvider, ModelInfo,
    StreamEvent,
};

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

/// One parsed SSE frame's JSON payload, matching Vorion's real Streaming
/// Prediction response schema (Barış's authenticated session, 2026-08-31) —
/// not assumed. Fields this adapter never reads (`round_number`,
/// `tool_progress`, `rag_sources`) are simply absent from this struct;
/// `serde` ignores unknown JSON fields by default (the same posture
/// `LlmListItem` already takes on "List LLMs"), so their presence in the
/// real wire payload is harmless.
#[derive(Debug, Deserialize)]
struct StreamChunkPayload {
    conversation_id: String,
    #[serde(default)]
    stream_id: Option<String>,
    #[serde(default)]
    chunk: String,
    #[serde(default)]
    is_final: bool,
    #[serde(default)]
    message_id: Option<String>,
    #[serde(default)]
    error: Option<String>,
}

/// Strips every `\r` byte from a raw network chunk before it joins the
/// accumulation buffer, so the buffer only ever needs to recognise `\n\n`
/// as an SSE event boundary (the spec permits `\r\n`, `\n`, or bare `\r` as
/// a line terminator; valid JSON can never itself contain a raw, unescaped
/// `\r` byte, so this can never corrupt a chunk's real text). Safe at the
/// byte level for any UTF-8 payload, including Turkish text: `\r` (0x0D) is
/// ASCII and can never appear as a continuation byte of a multi-byte
/// sequence, so removing it never splits one.
fn strip_carriage_returns(bytes: &[u8]) -> Vec<u8> {
    bytes.iter().copied().filter(|&b| b != b'\r').collect()
}

/// Drains every *complete* SSE event (terminated by a blank line, per the
/// `text/event-stream` spec — https://html.spec.whatwg.org/multipage/
/// server-sent-events.html) out of `buffer`, leaving any trailing partial
/// event for the next network read to complete. Operates on raw bytes
/// rather than a `String`: a network read can split a multi-byte UTF-8
/// character (Turkish ğ/ş/ç/ö/ü included) across two `bytes_stream()` items,
/// and decoding each item independently before concatenating would corrupt
/// it — see `strip_carriage_returns`'s doc comment for why draining on a
/// `\n\n` byte boundary is always UTF-8-safe. Only `data:` lines are read;
/// an `event:`/`id:`/`retry:` line or a `:`-prefixed comment (Vorion's docs
/// show none of these for this endpoint, but the SSE spec allows any of
/// them) is silently skipped rather than treated as an error — the same
/// "unknown fields are ignored" posture `StreamChunkPayload` already takes
/// one layer up. Multiple `data:` lines within one event are joined with
/// `\n`, per spec, though Vorion's own examples only ever show one.
fn drain_sse_events(buffer: &mut Vec<u8>) -> Vec<String> {
    let mut events = Vec::new();
    while let Some(boundary) = buffer.windows(2).position(|w| w == b"\n\n") {
        let raw_event_bytes: Vec<u8> = buffer.drain(..boundary + 2).collect();
        let raw_event = String::from_utf8_lossy(&raw_event_bytes);
        let data = raw_event
            .lines()
            .filter_map(|line| line.strip_prefix("data:"))
            .map(|value| value.strip_prefix(' ').unwrap_or(value))
            .collect::<Vec<_>>()
            .join("\n");
        if !data.is_empty() {
            events.push(data);
        }
    }
    events
}

#[derive(Debug, Serialize)]
struct CancelPredictionRequest {
    conversation_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    stream_id: Option<String>,
    reason: String,
}

/// Only the fields this adapter reads from Cancel Prediction's real
/// response (Barış's authenticated session, 2026-08-31) — `conversation_id`/
/// `stream_id` just echo the caller's own request back, so they're not
/// captured here. Kept snake_case (Vorion's real wire shape) and mapped into
/// the TS-facing, camelCase `CancelResult` by `cancel_result_from_response`,
/// the same wire-shape/TS-shape split `LlmListItem`→`model_info_from_item`
/// already establishes one type over.
#[derive(Debug, Deserialize)]
struct CancelPredictionResponse {
    success: bool,
    message: String,
    partial_response_saved: bool,
}

fn cancel_result_from_response(response: CancelPredictionResponse) -> CancelResult {
    CancelResult {
        success: response.success,
        message: response.message,
        partial_response_saved: response.partial_response_saved,
    }
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

    /// D-201: Streaming Prediction — `multipart/form-data` request (same
    /// `data` shape as Synchronous/`test_connection`), `text/event-stream`
    /// response, parsed by hand via `reqwest::bytes_stream()` (D-200
    /// deliberately skipped adding an SSE crate; this dilim tried the manual
    /// parse first, per its own §2.2 note, and it stayed simple enough that
    /// no crate was warranted).
    async fn complete(
        &self,
        req: CompletionRequest,
        tx: Channel<StreamEvent>,
    ) -> Result<CompletionMeta, AiError> {
        let (llm_name, llm_group_name) = split_model_id(&req.model_id);
        let request = PredictionRequest {
            prompt: PredictionPrompt { text: req.prompt },
            llm_name,
            llm_group_name,
        };
        let data = serde_json::to_string(&request)?;
        let form = reqwest::multipart::Form::new().text("data", data);

        let response = self
            .http
            .post(format!("{BASE_URL}/prediction/predict/stream"))
            .header("x-api-key", &self.api_key)
            .multipart(form)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status().as_u16();
            let body = response.text().await.unwrap_or_default();
            let message = format!("{status}: {body}");
            let _ = tx.send(StreamEvent::Error {
                message: message.clone(),
            });
            return Err(AiError::StreamFailed(message));
        }

        let mut byte_stream = response.bytes_stream();
        let mut buffer: Vec<u8> = Vec::new();
        let mut started_sent = false;
        let mut final_meta: Option<CompletionMeta> = None;

        while let Some(next) = byte_stream.next().await {
            let bytes = next?;
            buffer.extend(strip_carriage_returns(&bytes));

            for raw_event in drain_sse_events(&mut buffer) {
                let payload: StreamChunkPayload = serde_json::from_str(&raw_event)?;

                if !started_sent {
                    started_sent = true;
                    let _ = tx.send(StreamEvent::Started {
                        conversation_id: payload.conversation_id.clone(),
                        stream_id: payload.stream_id.clone(),
                    });
                }

                if let Some(message) = payload.error {
                    let _ = tx.send(StreamEvent::Error {
                        message: message.clone(),
                    });
                    return Err(AiError::StreamFailed(message));
                }

                if !payload.chunk.is_empty() {
                    let _ = tx.send(StreamEvent::Chunk {
                        text: payload.chunk,
                    });
                }

                if payload.is_final {
                    let meta = CompletionMeta {
                        conversation_id: payload.conversation_id,
                        stream_id: payload.stream_id,
                        message_id: payload.message_id,
                    };
                    let _ = tx.send(StreamEvent::Done { meta: meta.clone() });
                    final_meta = Some(meta);
                }
            }
        }

        final_meta.ok_or(AiError::StreamIncomplete)
    }

    /// Cancel Prediction — plain JSON, unlike every Prediction endpoint
    /// (confirmed against the real reference: `Content-Type:
    /// application/json`, not multipart).
    async fn cancel(
        &self,
        conversation_id: &str,
        stream_id: Option<&str>,
    ) -> Result<CancelResult, AiError> {
        let request = CancelPredictionRequest {
            conversation_id: conversation_id.to_string(),
            stream_id: stream_id.map(|s| s.to_string()),
            reason: "user_cancelled".to_string(),
        };
        let response: CancelPredictionResponse = self
            .http
            .post(format!("{BASE_URL}/prediction/predict/cancel"))
            .header("x-api-key", &self.api_key)
            .json(&request)
            .send()
            .await?
            .json()
            .await?;
        Ok(cancel_result_from_response(response))
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

    // D-201: `drain_sse_events`/`StreamChunkPayload` are pure and tested
    // directly, the same posture D-200's `split_model_id`/`model_info_from_item`
    // already took — no mock HTTP server is introduced for `complete()`/
    // `cancel()` themselves, matching this crate's existing convention of
    // never mocking `reqwest` (D-200 didn't either).

    #[test]
    fn drain_sse_events_extracts_a_single_complete_event() {
        let mut buffer = b"data: {\"chunk\":\"hi\"}\n\n".to_vec();

        let events = drain_sse_events(&mut buffer);

        assert_eq!(events, vec!["{\"chunk\":\"hi\"}".to_string()]);
        assert_eq!(buffer, Vec::<u8>::new());
    }

    #[test]
    fn drain_sse_events_leaves_a_trailing_partial_event_buffered() {
        let mut buffer = b"data: {\"chunk\":\"hi\"}\n\ndata: {\"chunk\":\"partial".to_vec();

        let events = drain_sse_events(&mut buffer);

        assert_eq!(events, vec!["{\"chunk\":\"hi\"}".to_string()]);
        assert_eq!(buffer, b"data: {\"chunk\":\"partial".to_vec());
    }

    #[test]
    fn drain_sse_events_joins_multiple_data_lines_in_one_event_with_newline() {
        let mut buffer = b"data: line one\ndata: line two\n\n".to_vec();

        let events = drain_sse_events(&mut buffer);

        assert_eq!(events, vec!["line one\nline two".to_string()]);
    }

    #[test]
    fn drain_sse_events_ignores_non_data_lines_and_comments() {
        let mut buffer = b"event: ping\n: keepalive\ndata: {\"chunk\":\"hi\"}\n\n".to_vec();

        let events = drain_sse_events(&mut buffer);

        assert_eq!(events, vec!["{\"chunk\":\"hi\"}".to_string()]);
    }

    #[test]
    fn drain_sse_events_returns_nothing_for_an_empty_buffer() {
        let mut buffer: Vec<u8> = Vec::new();

        assert_eq!(drain_sse_events(&mut buffer), Vec::<String>::new());
    }

    #[test]
    fn strip_carriage_returns_removes_every_cr_byte() {
        let stripped = strip_carriage_returns(b"data: hi\r\n\r\n");

        assert_eq!(stripped, b"data: hi\n\n".to_vec());
    }

    /// The regression this whole byte-buffer design exists to prevent:
    /// decoding each network chunk to UTF-8 independently, before
    /// concatenating, would corrupt a Turkish character split across two
    /// `bytes_stream()` reads. `ğ` (U+011F) encodes as the two bytes
    /// `0xC4 0x9F` — this test splits exactly between them, simulating two
    /// separate network reads, and proves the byte-level buffer reassembles
    /// it correctly before any UTF-8 decoding happens.
    #[test]
    fn drain_sse_events_reassembles_a_turkish_character_split_across_two_network_reads() {
        let full_event = "data: {\"chunk\":\"değil\"}\n\n".as_bytes().to_vec();
        let split_point = full_event
            .windows(2)
            .position(|w| w == [0xC4, 0x9F])
            .expect("the test fixture must contain the two-byte ğ encoding")
            + 1;
        let (first_read, second_read) = full_event.split_at(split_point);

        let mut buffer: Vec<u8> = Vec::new();
        buffer.extend(strip_carriage_returns(first_read));
        assert_eq!(drain_sse_events(&mut buffer), Vec::<String>::new());

        buffer.extend(strip_carriage_returns(second_read));
        let events = drain_sse_events(&mut buffer);

        assert_eq!(events, vec!["{\"chunk\":\"değil\"}".to_string()]);
    }

    /// Deserializes a chunk shaped exactly like Vorion's real Streaming
    /// Prediction response schema (Barış's authenticated session,
    /// 2026-08-31), including fields this adapter never reads
    /// (`round_number`, `tool_progress`, `rag_sources`), proving they're
    /// safely ignored rather than only asserting it in a comment.
    #[test]
    fn stream_chunk_payload_deserializes_from_the_real_documented_shape() {
        let body = serde_json::json!({
            "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
            "stream_id": "str-abc123",
            "chunk_index": 0,
            "chunk": "Hello",
            "is_final": false,
            "round_number": 0,
            "message_id": null,
            "error": null,
            "tool_progress": null,
            "rag_sources": null
        })
        .to_string();

        let payload: StreamChunkPayload = serde_json::from_str(&body).unwrap();

        assert_eq!(
            payload.conversation_id,
            "550e8400-e29b-41d4-a716-446655440000"
        );
        assert_eq!(payload.stream_id, Some("str-abc123".to_string()));
        assert_eq!(payload.chunk, "Hello");
        assert!(!payload.is_final);
        assert_eq!(payload.message_id, None);
        assert_eq!(payload.error, None);
    }

    /// The final frame: `chunk` empty, `is_final: true`, `message_id`
    /// populated — per the docs' own "after this, `message_id` and
    /// `rag_sources` are populated" note.
    #[test]
    fn stream_chunk_payload_deserializes_a_final_frame() {
        let body = serde_json::json!({
            "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
            "stream_id": "str-abc123",
            "chunk": "",
            "is_final": true,
            "message_id": "msg-999"
        })
        .to_string();

        let payload: StreamChunkPayload = serde_json::from_str(&body).unwrap();

        assert!(payload.is_final);
        assert_eq!(payload.message_id, Some("msg-999".to_string()));
    }

    /// A stream-level failure, e.g. `context_length_exceeded` — the docs'
    /// own example error.
    #[test]
    fn stream_chunk_payload_deserializes_an_error_frame() {
        let body = serde_json::json!({
            "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
            "chunk": "",
            "is_final": true,
            "error": "context_length_exceeded"
        })
        .to_string();

        let payload: StreamChunkPayload = serde_json::from_str(&body).unwrap();

        assert_eq!(payload.error, Some("context_length_exceeded".to_string()));
    }

    #[test]
    fn cancel_prediction_request_serializes_with_vorions_exact_field_names() {
        let request = CancelPredictionRequest {
            conversation_id: "550e8400-e29b-41d4-a716-446655440000".to_string(),
            stream_id: Some("str-abc123".to_string()),
            reason: "user_cancelled".to_string(),
        };

        let json = serde_json::to_value(&request).unwrap();

        assert_eq!(
            json["conversation_id"],
            "550e8400-e29b-41d4-a716-446655440000"
        );
        assert_eq!(json["stream_id"], "str-abc123");
        assert_eq!(json["reason"], "user_cancelled");
    }

    #[test]
    fn cancel_prediction_request_omits_stream_id_when_absent_rather_than_sending_null() {
        let request = CancelPredictionRequest {
            conversation_id: "550e8400-e29b-41d4-a716-446655440000".to_string(),
            stream_id: None,
            reason: "user_cancelled".to_string(),
        };

        let json = serde_json::to_value(&request).unwrap();

        assert!(!json.as_object().unwrap().contains_key("stream_id"));
    }

    /// Deserializes a response shaped exactly like Vorion's real Cancel
    /// Prediction reference, including fields this adapter never reads
    /// (`conversation_id`, `stream_id` echo back the caller's own input),
    /// then maps it into the TS-facing `CancelResult`.
    #[test]
    fn cancel_result_deserializes_from_the_real_documented_shape() {
        let body = serde_json::json!({
            "success": true,
            "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
            "stream_id": "str-abc123",
            "message": "Prediction cancelled",
            "partial_response_saved": true,
            "message_id": "msg-999"
        })
        .to_string();

        let response: CancelPredictionResponse = serde_json::from_str(&body).unwrap();
        let result = cancel_result_from_response(response);

        assert_eq!(
            result,
            CancelResult {
                success: true,
                message: "Prediction cancelled".to_string(),
                partial_response_saved: true,
            }
        );
    }
}
