/// D-200: mirrors `PpsxError`/`ImageIngestError`'s posture — every variant
/// describes a keychain, request-building or transport failure, never a
/// domain-shape one. None of these ever carry the secret key itself:
/// `keyring::Error`'s own variants describe platform/store failures, not the
/// stored value (verified against `keyring-core`'s source, not assumed);
/// `serde_json::Error` describes a serialization failure, never the value
/// being serialized; `reqwest::Error` describes a transport failure — it
/// never echoes request headers (the one place the key lives) into its
/// `Display` output. CLAUDE.md's "API keys leaking into logs, crash reports,
/// error strings" warning is closed by construction here, not by a scrubber
/// layer. Kept deliberately small — only variants an existing call site
/// actually constructs, grown in step with what's wired up rather than ahead
/// of it (an unused variant would fail this crate's own
/// `cargo clippy --all-targets -- -D warnings` gate).
#[derive(Debug, thiserror::Error)]
pub enum AiError {
    #[error("keychain error: {0}")]
    Keychain(#[from] keyring::Error),

    #[error("no API key is configured")]
    NoKeyConfigured,

    #[error("json error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("request error: {0}")]
    Http(#[from] reqwest::Error),

    /// D-201: a Vorion-reported failure mid-stream (its own documented
    /// `error` field on a chunk, e.g. `context_length_exceeded`) or a
    /// non-success HTTP status opening the stream — distinct from `Http`,
    /// which is a transport failure, not the provider answering with a
    /// failure of its own.
    #[error("stream failed: {0}")]
    StreamFailed(String),

    /// SPEC.md §8.14: "Stream interrupted mid-response → partial content is
    /// discarded, not half-written into a proposal." The connection closed
    /// (no transport error, no reported `error` field) before a frame with
    /// `is_final: true` ever arrived.
    #[error("the stream ended before a final response was received")]
    StreamIncomplete,

    /// J1/§8.7: Vorion's Prediction family has no native structured-output
    /// parameter (confirmed against real Synchronous/Streaming Prediction
    /// docs, Barış's authenticated session, 2026-08-31 — neither endpoint's
    /// Request Body table has anything like `response_format`/`json_schema`)
    /// — `complete_structured` asks for JSON via the prompt text instead, so
    /// the model's `response` field can still fail to parse as JSON at all.
    /// The `Display` is deliberately just the raw text with no prefix: the
    /// frontend's `.map_err(|e| e.to_string())` boundary (matching every
    /// other command in this crate) means this string IS what SPEC.md §8.14
    /// calls "the raw response, surfaced to the user as text" — a label
    /// belongs in the TS layer, not baked into the error message itself.
    #[error("{0}")]
    StructuredOutputNotJson(String),
}
