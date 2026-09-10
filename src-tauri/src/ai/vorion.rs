use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use std::time::Instant;
use tauri::ipc::Channel;

use super::error::AiError;
use super::provider::{
    CancelResult, Capabilities, CompletionMeta, CompletionRequest, CompletionUsage,
    ConnectionStatus, LlmProvider, ModelInfo, StreamEvent, StructuredCompletionResult,
    StructuredRequest,
};
use super::redaction::{redact_text, unredact_json_value, RedactionMode, RedactionPolicy};

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
    /// D-200/D-245: documented, optional — confirmed present on the real
    /// Synchronous Prediction request body (Barış's authenticated session,
    /// 2026-08-30). `None` on the first message of a thread and on every
    /// `test_connection`/`complete_structured` call (neither is part of a
    /// multi-turn conversation).
    #[serde(skip_serializing_if = "Option::is_none")]
    conversation_id: Option<String>,
}

/// Only the fields this adapter actually reads from `GET /llm/api/v1/llms` —
/// confirmed against the real "List LLMs" reference (Barış's authenticated
/// session, 2026-08-30). `group_name` is exactly the value the Synchronous
/// Prediction request calls `llm_group_name` — the docs' own worked example
/// requests `group_name: "gpt-4o"` as `"llm_group_name": "gpt-4o"`.
///
/// Faz 10/K4/§2.4: `cost_per_input_token`/`cost_per_output_token` were
/// already confirmed present in this same response by D-213 but never read
/// until now — the real Synchronous Prediction response (`PredictionResponse`
/// below) has no cost field of its own, so this is the only place per-token
/// pricing actually comes from. `Option` because not every model necessarily
/// carries a price (a self-hosted or free model, say).
#[derive(Debug, Deserialize)]
struct LlmListItem {
    provider_name: String,
    model_name: String,
    group_name: String,
    #[serde(default)]
    display_name: Option<String>,
    #[serde(default)]
    cost_per_input_token: Option<f64>,
    #[serde(default)]
    cost_per_output_token: Option<f64>,
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

/// Only the fields this adapter reads from Synchronous Prediction's real
/// response (the same endpoint `test_connection` already calls, D-200) —
/// confirmed against the real Response Schema table (Barış's authenticated
/// `vorionai.com/docs` session, 2026-09-06): `input_tokens`/`output_tokens`
/// are both `integer | null, OPTIONAL`. The real schema has **no** `cost`/
/// `total_cost` field anywhere — a separate screenshot Barış also captured
/// (Vorion's own docs *chatbot*, not the reference table) speculated one
/// might exist, hedged throughout ("muhtemelen", "büyük ihtimalle") and even
/// told Barış to go verify with support — the exact unreliable-self-report
/// pattern D-199 already caught this same chatbot in once before, so that
/// guess is deliberately NOT trusted here. Every other documented field
/// (`message_id`, `reasoning`/`reasoning_tokens`, `cache_*_tokens`,
/// `rag_sources`, `persisted_file_ids`, `pending_async_tasks`, …) is ignored
/// the same way `LlmListItem` already ignores fields it doesn't read — this
/// app never enables thinking mode or RAG (D-15/D-16).
#[derive(Debug, Deserialize)]
struct PredictionResponse {
    response: String,
    #[serde(default)]
    input_tokens: Option<u64>,
    #[serde(default)]
    output_tokens: Option<u64>,
}

/// `cost_usd` stays `None` here — the real response carries no direct cost
/// field (see `PredictionResponse`'s own doc comment). `ai::commands::
/// ai_complete_structured` fills it in afterwards, but only when a spend cap
/// is actually configured, via `VorionProvider::estimate_cost_usd` reading
/// the real per-token pricing `LlmListItem` already carries.
fn completion_usage_from_response(response: &PredictionResponse) -> CompletionUsage {
    CompletionUsage {
        input_tokens: response.input_tokens,
        output_tokens: response.output_tokens,
        cost_usd: None,
    }
}

/// Pure match: finds the first `LlmListItem` whose id (`VorionProvider`'s own
/// `"{provider_name}/{group_name}"` shape, or a bare `provider_name` when the
/// caller's `model_id` has no group) equals `model_id`, and returns its
/// per-token rates — `None` if nothing matches, or the match has no price
/// data for one or both directions.
fn find_pricing_in_items(items: &[LlmListItem], model_id: &str) -> Option<(f64, f64)> {
    items.iter().find_map(|item| {
        let full_id = format!("{}/{}", item.provider_name, item.group_name);
        if full_id != model_id && item.provider_name != model_id {
            return None;
        }
        match (item.cost_per_input_token, item.cost_per_output_token) {
            (Some(input), Some(output)) => Some((input, output)),
            _ => None,
        }
    })
}

/// Pure: `None` whenever either token count is missing, so a partial usage
/// (possible per `PredictionResponse`'s own `Option` fields) never produces
/// a silently-wrong half-computed cost.
fn compute_cost_usd(
    input_tokens: Option<u64>,
    output_tokens: Option<u64>,
    rates: (f64, f64),
) -> Option<f64> {
    let (cost_per_input, cost_per_output) = rates;
    Some(input_tokens? as f64 * cost_per_input + output_tokens? as f64 * cost_per_output)
}

/// J1/§2.2: Vorion has no native structured-output parameter (confirmed
/// against the real docs, §2.1's own finding) — the schema is embedded
/// directly into the prompt text as the only way to ask for JSON-shaped
/// output. This is the one place this crate touches `schema`'s content at
/// all, and only to serialize it verbatim; nothing here branches on what
/// the schema says (D-04's "dumb serializer" boundary, `StructuredRequest`'s
/// own doc comment).
fn build_structured_prompt(logical_prompt: &str, schema: &serde_json::Value) -> String {
    let schema_json = serde_json::to_string_pretty(schema).unwrap_or_else(|_| schema.to_string());
    format!(
        "{logical_prompt}\n\n---\n\nRespond with ONLY a single JSON object matching the JSON \
         Schema below. No prose, no markdown code fences, no explanation before or after — the \
         entire response body must be valid, parseable JSON on its own.\n\nJSON Schema:\n{schema_json}"
    )
}

/// Strips a single leading/trailing markdown code fence (```` ```json `` ``
/// or plain ```` ``` ````) if the whole trimmed response is wrapped in one —
/// a common model habit even when explicitly told not to. Anything else
/// (including a response that's already bare JSON) passes through
/// unchanged; `serde_json::from_str` is the real judge of validity, not this
/// function.
fn strip_json_code_fence(text: &str) -> &str {
    let trimmed = text.trim();
    let Some(after_open) = trimmed.strip_prefix("```") else {
        return trimmed;
    };
    let after_open = after_open.strip_prefix("json").unwrap_or(after_open);
    let after_open = after_open.strip_prefix('\n').unwrap_or(after_open);
    match after_open.strip_suffix("```") {
        Some(body) => body.trim(),
        None => trimmed,
    }
}

/// Parses Vorion's `response` text as the raw JSON value `complete_structured`
/// promises — trying the text as-is first, then with a markdown code fence
/// stripped, since a model can wrap valid JSON in one despite instructions
/// not to. `AiError::StructuredOutputNotJson` carries the *original*
/// (unstripped) text: SPEC.md §8.14's "surface the raw response to the user
/// as text" means the literal model output, not this adapter's cleanup
/// attempt.
fn parse_structured_response(raw: &str) -> Result<serde_json::Value, AiError> {
    if let Ok(value) = serde_json::from_str(raw) {
        return Ok(value);
    }
    if let Ok(value) = serde_json::from_str(strip_json_code_fence(raw)) {
        return Ok(value);
    }
    Err(AiError::StructuredOutputNotJson(raw.to_string()))
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

    /// The one real HTTP call behind both `list_models` and
    /// `find_model_cost_rates` — extracted so the request/pagination/query
    /// string exists in exactly one place (D-127's own "extract before the
    /// second repetition" discipline).
    async fn fetch_llm_list(&self) -> Result<ListLlmsResponse, AiError> {
        Ok(self
            .http
            .get(format!("{BASE_URL}/llms?available_only=true&page_size=100"))
            .header("x-api-key", &self.api_key)
            .send()
            .await?
            .json()
            .await?)
    }

    /// Faz 10/K4/§2.4: looks up a model's real per-token pricing —
    /// deliberately its own network call rather than a persisted cache next
    /// to `AiSettings` (Barış, delegated to this session's own judgment,
    /// 2026-09-06): the common case has no spend cap configured at all, so
    /// `ai::commands::ai_complete_structured` only ever calls this when
    /// `AiSettings::spend_cap_usd` is `Some` — the one feature that actually
    /// needs a dollar figure pays the extra round trip, everything else
    /// (D-21's "no cache yet" posture) stays exactly as fast as before.
    async fn find_model_cost_rates(&self, model_id: &str) -> Result<Option<(f64, f64)>, AiError> {
        let response = self.fetch_llm_list().await?;
        Ok(find_pricing_in_items(&response.items, model_id))
    }

    /// Turns a completed call's raw token counts into a dollar figure, or
    /// `None` if pricing isn't available for this model — `ai::commands::
    /// ai_complete_structured` is the only caller, and only when a spend cap
    /// is configured. A pricing-lookup failure (network error, unexpected
    /// shape) propagates as `Err` so the caller can log it and fall back to
    /// leaving `cost_usd` unset, rather than this function silently guessing.
    pub async fn estimate_cost_usd(
        &self,
        model_id: &str,
        usage: &CompletionUsage,
    ) -> Result<Option<f64>, AiError> {
        let Some(rates) = self.find_model_cost_rates(model_id).await? else {
            return Ok(None);
        };
        Ok(compute_cost_usd(
            usage.input_tokens,
            usage.output_tokens,
            rates,
        ))
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
        let response = self.fetch_llm_list().await?;

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
            conversation_id: None,
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
            conversation_id: req.conversation_id,
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

    /// J1/§2.2: Synchronous Prediction, not Streaming — a JSON payload has
    /// to be complete before it can be parsed at all, so there is no benefit
    /// to token-by-token delivery here, and reusing `test_connection`'s
    /// already-proven request shape (multipart `data`, `PredictionRequest`)
    /// keeps this dilim's one new mechanism smaller than re-deriving SSE
    /// handling for a case that never needs it.
    async fn complete_structured(
        &self,
        req: StructuredRequest,
    ) -> Result<StructuredCompletionResult, AiError> {
        let default_policy = RedactionPolicy {
            mode: RedactionMode::Off,
            terms: Vec::new(),
            preserve_numbers: true,
        };
        let policy = req.redaction.as_ref().unwrap_or(&default_policy);
        let (masked_prompt, tokens) = redact_text(&req.prompt, policy);

        let (llm_name, llm_group_name) = split_model_id(&req.model_id);
        let request = PredictionRequest {
            prompt: PredictionPrompt {
                text: build_structured_prompt(&masked_prompt, &req.schema),
            },
            llm_name,
            llm_group_name,
            conversation_id: None,
        };
        let data = serde_json::to_string(&request)?;
        let form = reqwest::multipart::Form::new().text("data", data);

        let response: PredictionResponse = self
            .http
            .post(format!("{BASE_URL}/prediction/predict"))
            .header("x-api-key", &self.api_key)
            .multipart(form)
            .send()
            .await?
            .json()
            .await?;

        let mut value = parse_structured_response(&response.response)?;
        unredact_json_value(&mut value, &tokens);
        let usage = completion_usage_from_response(&response);
        Ok(StructuredCompletionResult { value, usage })
    }

    /// §2.1's own finding: neither Synchronous nor Streaming Prediction has
    /// a `response_format`/`json_schema`/`output_schema` parameter anywhere
    /// in the real docs (Barış's authenticated session, 2026-08-31) —
    /// `complete_structured` is prompt engineering, not a native feature.
    fn capabilities(&self) -> Capabilities {
        Capabilities { json_schema: false }
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
            conversation_id: None,
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
            conversation_id: None,
        };

        let json = serde_json::to_value(&request).unwrap();

        assert!(!json.as_object().unwrap().contains_key("llm_group_name"));
    }

    #[test]
    fn prediction_request_sends_conversation_id_when_continuing_a_thread() {
        let request = PredictionRequest {
            prompt: PredictionPrompt {
                text: "follow-up".to_string(),
            },
            llm_name: "openai".to_string(),
            llm_group_name: Some("gpt-4o".to_string()),
            conversation_id: Some("conv-123".to_string()),
        };

        let json = serde_json::to_value(&request).unwrap();

        assert_eq!(json["conversation_id"], "conv-123");
    }

    #[test]
    fn prediction_request_omits_conversation_id_when_absent_rather_than_sending_null() {
        let request = PredictionRequest {
            prompt: PredictionPrompt {
                text: "first message".to_string(),
            },
            llm_name: "vorion".to_string(),
            llm_group_name: None,
            conversation_id: None,
        };

        let json = serde_json::to_value(&request).unwrap();

        assert!(!json.as_object().unwrap().contains_key("conversation_id"));
    }

    #[test]
    fn model_info_from_item_joins_provider_and_group_into_a_slash_separated_id() {
        let mut item = sample_pricing_item("openai", "gpt-4o", None, None);
        item.model_name = "gpt-4o-2024-08-06".to_string();
        item.display_name = Some("GPT-4o".to_string());

        let info = model_info_from_item(item);

        assert_eq!(info.id, "openai/gpt-4o");
        assert_eq!(info.name, "GPT-4o");
        assert_eq!(info.provider, "openai");
    }

    #[test]
    fn model_info_from_item_falls_back_to_model_name_when_display_name_is_absent() {
        let mut item = sample_pricing_item("groq", "llama-3.1-8b", None, None);
        item.model_name = "llama-3.1-8b-instant".to_string();

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
    // J1/§2.2: `build_structured_prompt`/`strip_json_code_fence`/
    // `parse_structured_response` are pure and tested directly, the same
    // posture D-200/D-201's own SSE-parsing functions already took.

    #[test]
    fn build_structured_prompt_embeds_the_schema_and_a_json_only_instruction() {
        let schema =
            serde_json::json!({"type": "object", "properties": {"unit": {"type": "string"}}});

        let prompt = build_structured_prompt("Draft a Pareto chart.", &schema);

        assert!(prompt.contains("Draft a Pareto chart."));
        assert!(prompt.contains("ONLY a single JSON object"));
        assert!(prompt.contains("\"unit\""));
    }

    #[test]
    fn strip_json_code_fence_removes_a_json_tagged_fence() {
        let wrapped = "```json\n{\"a\":1}\n```";

        assert_eq!(strip_json_code_fence(wrapped), "{\"a\":1}");
    }

    #[test]
    fn strip_json_code_fence_removes_a_bare_fence() {
        let wrapped = "```\n{\"a\":1}\n```";

        assert_eq!(strip_json_code_fence(wrapped), "{\"a\":1}");
    }

    #[test]
    fn strip_json_code_fence_leaves_unwrapped_text_unchanged() {
        assert_eq!(strip_json_code_fence("{\"a\":1}"), "{\"a\":1}");
    }

    #[test]
    fn parse_structured_response_accepts_bare_json() {
        let value = parse_structured_response("{\"a\":1}").unwrap();

        assert_eq!(value, serde_json::json!({"a": 1}));
    }

    #[test]
    fn parse_structured_response_rejects_json_embedded_in_surrounding_prose() {
        let value =
            parse_structured_response("Sure, here you go:\n```json\n{\"a\":1}\n```").unwrap_err();

        // The prose-plus-fence case is deliberately NOT recovered — only a
        // response that is *entirely* a fenced block (after trimming) is
        // unwrapped. Recovering JSON embedded in arbitrary prose would be
        // exactly the kind of silent leniency this dilim's own instructions
        // explicitly reject ("no prose... the entire response must be valid
        // JSON on its own").
        assert!(matches!(value, AiError::StructuredOutputNotJson(_)));
    }

    #[test]
    fn parse_structured_response_unwraps_a_fully_fenced_response() {
        let value = parse_structured_response("```json\n{\"a\":1}\n```").unwrap();

        assert_eq!(value, serde_json::json!({"a": 1}));
    }

    #[test]
    fn parse_structured_response_fails_with_the_original_unstripped_text() {
        let raw = "not json at all, just prose";

        let error = parse_structured_response(raw).unwrap_err();

        match error {
            AiError::StructuredOutputNotJson(text) => assert_eq!(text, raw),
            other => panic!("expected StructuredOutputNotJson, got {other:?}"),
        }
    }

    /// Deserializes a response shaped exactly like the real Synchronous
    /// Prediction Response Schema table (Barış's authenticated session,
    /// 2026-09-06), including every field this adapter never reads
    /// (`message_id`, `user_id`, `app_id`, `reasoning*`, `cache_*_tokens`,
    /// `model_name`/`model_provider`, `persisted_file_ids`, `rag_sources`,
    /// `pending_async_tasks`) — proving they're safely ignored rather than
    /// only asserting it in a comment, the same discipline
    /// `list_llms_response_deserializes_from_the_real_documented_shape`
    /// already established one type over. Deliberately does NOT include a
    /// `cost`/`total_cost` field: the real Response Schema table has none —
    /// see `PredictionResponse`'s own doc comment for why a chatbot-supplied
    /// guess suggesting one is not trusted here.
    #[test]
    fn prediction_response_deserializes_from_the_real_documented_shape() {
        let body = serde_json::json!({
            "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
            "response": "Quantum computing uses qubits...",
            "message_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
            "user_id": null,
            "app_id": null,
            "reasoning": null,
            "reasoning_tokens": null,
            "input_tokens": 1000,
            "output_tokens": 500,
            "total_tokens": 1500,
            "cache_read_tokens": null,
            "cache_creation_tokens": null,
            "model_name": "gpt-4o-2024-08-06",
            "model_provider": "openai",
            "persisted_file_ids": null,
            "rag_sources": null,
            "pending_async_tasks": null
        })
        .to_string();

        let response: PredictionResponse = serde_json::from_str(&body).unwrap();

        assert_eq!(response.response, "Quantum computing uses qubits...");
        assert_eq!(response.input_tokens, Some(1000));
        assert_eq!(response.output_tokens, Some(500));
    }

    #[test]
    fn completion_usage_from_response_extracts_input_and_output_tokens_with_cost_left_unset() {
        let response = PredictionResponse {
            response: "hi".to_string(),
            input_tokens: Some(120),
            output_tokens: Some(45),
        };

        let usage = completion_usage_from_response(&response);

        assert_eq!(usage.input_tokens, Some(120));
        assert_eq!(usage.output_tokens, Some(45));
        assert_eq!(usage.cost_usd, None);
    }

    #[test]
    fn completion_usage_from_response_defaults_to_none_when_token_fields_are_absent() {
        let response = PredictionResponse {
            response: "{}".to_string(),
            input_tokens: None,
            output_tokens: None,
        };

        assert_eq!(
            completion_usage_from_response(&response),
            CompletionUsage::default()
        );
    }

    fn sample_pricing_item(
        provider_name: &str,
        group_name: &str,
        cost_per_input_token: Option<f64>,
        cost_per_output_token: Option<f64>,
    ) -> LlmListItem {
        LlmListItem {
            provider_name: provider_name.to_string(),
            model_name: format!("{provider_name}-{group_name}-model"),
            group_name: group_name.to_string(),
            display_name: None,
            cost_per_input_token,
            cost_per_output_token,
        }
    }

    #[test]
    fn find_pricing_in_items_finds_a_match_by_provider_and_group() {
        let items = vec![sample_pricing_item(
            "openai",
            "gpt-4o",
            Some(0.0000025),
            Some(0.00001),
        )];

        let rates = find_pricing_in_items(&items, "openai/gpt-4o");

        assert_eq!(rates, Some((0.0000025, 0.00001)));
    }

    #[test]
    fn find_pricing_in_items_matches_a_bare_provider_id_with_no_group() {
        let items = vec![sample_pricing_item(
            "vorion",
            "default",
            Some(0.001),
            Some(0.002),
        )];

        let rates = find_pricing_in_items(&items, "vorion");

        assert_eq!(rates, Some((0.001, 0.002)));
    }

    #[test]
    fn find_pricing_in_items_returns_none_when_no_item_matches() {
        let items = vec![sample_pricing_item(
            "openai",
            "gpt-4o",
            Some(0.0000025),
            Some(0.00001),
        )];

        assert_eq!(find_pricing_in_items(&items, "anthropic/claude"), None);
    }

    #[test]
    fn find_pricing_in_items_returns_none_when_the_matching_item_has_no_price_data() {
        let items = vec![sample_pricing_item("openai", "gpt-4o", None, None)];

        assert_eq!(find_pricing_in_items(&items, "openai/gpt-4o"), None);
    }

    #[test]
    fn compute_cost_usd_multiplies_tokens_by_their_respective_rates() {
        let cost = compute_cost_usd(Some(1000), Some(500), (0.0000025, 0.00001));

        assert!((cost.unwrap() - 0.0075).abs() < 1e-9);
    }

    #[test]
    fn compute_cost_usd_returns_none_when_either_token_count_is_missing() {
        assert_eq!(
            compute_cost_usd(None, Some(500), (0.0000025, 0.00001)),
            None
        );
        assert_eq!(
            compute_cost_usd(Some(1000), None, (0.0000025, 0.00001)),
            None
        );
    }

    #[test]
    fn vorion_provider_reports_no_native_json_schema_support() {
        let provider = VorionProvider::new("fake-key".to_string());

        assert_eq!(provider.capabilities(), Capabilities { json_schema: false });
    }

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
