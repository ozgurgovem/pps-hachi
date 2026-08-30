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
}
