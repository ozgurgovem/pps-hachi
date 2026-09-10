use tauri::ipc::Channel;
use tauri::{AppHandle, Manager};

use super::error::AiError;
use super::keychain::{masked_preview, KeyringSecretStore, SecretStore};
use super::provider::{
    CancelResult, Capabilities, CompletionMeta, CompletionRequest, CompletionUsage,
    ConnectionStatus, LlmProvider, ModelInfo, StreamEvent, StructuredRequest,
};
use super::redaction::RedactionPolicy;
use super::settings::{self, AiSettings};
use super::usage::{self, AiLogEntry, CostSummary};
use super::vorion::VorionProvider;

const AI_SETTINGS_FILE_NAME: &str = "ai-settings.json";

// The tauri-command boundary stays a thin `Result<_, String>` wrapper (same
// posture as every other command in this crate — `ppsx::commands`,
// `commands::xlsx`) around a plain function generic over `impl SecretStore`,
// so these three can be exercised in tests against `keychain::fake::
// FakeSecretStore` without ever touching the real OS keychain (D-200's own
// note on why: a non-interactive `cargo test` run has no one to click
// through a permission prompt).

fn set_key_logic(store: &impl SecretStore, key: &str) -> Result<String, AiError> {
    store.set(key)?;
    Ok(masked_preview(key))
}

fn key_status_logic(store: &impl SecretStore) -> Result<Option<String>, AiError> {
    Ok(store.get()?.map(|key| masked_preview(&key)))
}

fn remove_key_logic(store: &impl SecretStore) -> Result<(), AiError> {
    store.delete()
}

/// Stores the key in the OS keychain (D-14: never in `localStorage`, never in
/// the `.ppsx`, never logged) and returns only a masked preview — the raw
/// key crosses this one, unavoidable IPC hop from the paste field and goes
/// no further (CLAUDE.md §8.3's "re-entry replaces; there is no reveal").
#[tauri::command]
pub fn ai_set_key(key: String) -> Result<String, String> {
    set_key_logic(&KeyringSecretStore, &key).map_err(|e| e.to_string())
}

/// `None` means no key is configured; `Some(masked)` never contains enough
/// of the real key to reconstruct it.
#[tauri::command]
pub fn ai_key_status() -> Result<Option<String>, String> {
    key_status_logic(&KeyringSecretStore).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn ai_remove_key() -> Result<(), String> {
    remove_key_logic(&KeyringSecretStore).map_err(|e| e.to_string())
}

/// SPEC.md §8.3: "the smallest possible real request... reports latency...
/// and any billing/quota error verbatim." `model_id` is whatever the
/// frontend's model selector currently has chosen (D-200: `"{llm_name}/
/// {llm_group_name}"`, e.g. `"openai/gpt-4o"`).
#[tauri::command]
pub async fn ai_test_connection(model_id: String) -> Result<ConnectionStatus, String> {
    let api_key = KeyringSecretStore
        .get()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| AiError::NoKeyConfigured.to_string())?;
    VorionProvider::new(api_key)
        .test_connection(&model_id)
        .await
        .map_err(|e| e.to_string())
}

/// D-21: the model selector's live source — never a hardcoded list.
#[tauri::command]
pub async fn ai_list_models() -> Result<Vec<ModelInfo>, String> {
    let api_key = KeyringSecretStore
        .get()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| AiError::NoKeyConfigured.to_string())?;
    VorionProvider::new(api_key)
        .list_models()
        .await
        .map_err(|e| e.to_string())
}

/// D-201: `prompt`/`model_id` cross the IPC boundary as plain `#[tauri::
/// command]` arguments (same posture as `ai_test_connection`'s `model_id`),
/// `channel` is Tauri's own convention for a command that streams progress
/// back before its promise resolves. Never touches `ProjectModel` — D-15's
/// LOCKED rule means only an explicit Accept in the frontend can do that;
/// this command's only job is to get Vorion's tokens onto the wire.
///
/// D-245: `conversation_id` is new — `None` for the first message of a
/// thread, `Some(...)` (the previous turn's own returned id) for a
/// follow-up, letting Vorion itself continue the same conversation
/// server-side rather than the frontend re-sending a growing transcript.
#[tauri::command]
pub async fn ai_complete(
    prompt: String,
    model_id: String,
    conversation_id: Option<String>,
    channel: Channel<StreamEvent>,
) -> Result<CompletionMeta, String> {
    let api_key = KeyringSecretStore
        .get()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| AiError::NoKeyConfigured.to_string())?;
    VorionProvider::new(api_key)
        .complete(
            CompletionRequest {
                prompt,
                model_id,
                conversation_id,
            },
            channel,
        )
        .await
        .map_err(|e| e.to_string())
}

/// SPEC.md §8.14 "Stream interrupted mid-response": the frontend calls this
/// once it has captured `conversationId`/`streamId` off the first
/// `StreamEvent::Started` — Cancel Prediction is a plain request/response,
/// no channel involved.
#[tauri::command]
pub async fn ai_cancel(
    conversation_id: String,
    stream_id: Option<String>,
) -> Result<CancelResult, String> {
    let api_key = KeyringSecretStore
        .get()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| AiError::NoKeyConfigured.to_string())?;
    VorionProvider::new(api_key)
        .cancel(&conversation_id, stream_id.as_deref())
        .await
        .map_err(|e| e.to_string())
}

/// J1/SPEC.md §8.7: a schema-bound draft. `prompt`/`schema`/`model_id` cross
/// the IPC boundary as plain arguments (same posture as `ai_complete`'s
/// `prompt`/`model_id`) — no channel, since there is nothing to stream. Like
/// every command in this file, never touches `ProjectModel` itself; only the
/// frontend's explicit Accept can do that (D-15).
///
/// Faz 10/K4/§2.1/§2.4: `project_id`/`prompt_version` are new — Rust has no
/// ambient notion of "the currently open project," so per-project log
/// attribution can only cross the IPC boundary as an explicit argument (the
/// one real, unavoidable consequence of Barış's chosen plumbing, §2.1 of
/// `K4-maliyet-sayaci.md`). The *return* type stays exactly
/// `Result<serde_json::Value, String>` — every one of K1/K2/K3's
/// `attemptStructuredProposal`-based call chains is untouched by this.
/// Before calling Vorion at all, checks the global per-month spend cap
/// (`ai::settings::AiSettings::spend_cap_usd`) against the accumulated total
/// (`ai::usage`) and rejects with `AiError::SpendCapExceeded` if it is
/// already met — SPEC.md §8.12's "degrades to offline mode rather than
/// erroring" means *this one call* is refused, `meta.ai.enabled` is never
/// touched. The real Synchronous Prediction response has no cost field of
/// its own (`vorion::completion_usage_from_response`'s own doc comment,
/// confirmed against the real Response Schema table, 2026-09-06) — a dollar
/// figure is only ever computed, via `VorionProvider::estimate_cost_usd`
/// reading `List LLMs`' real per-token pricing, when a spend cap is actually
/// configured; the common case (no cap set) pays no extra round trip. After
/// a successful call, appends one `AiLogEntry` to this project's own log
/// sidecar and updates the global monthly accumulator, both best-effort (a
/// logging failure is reported to stderr, never turned into a lost,
/// otherwise-successful AI response — SPEC.md §8.14's "none of these may
/// lose user data" applies to the log's own reliability too).
#[tauri::command]
pub async fn ai_complete_structured(
    app: AppHandle,
    prompt: String,
    schema: serde_json::Value,
    model_id: String,
    redaction: Option<RedactionPolicy>,
    project_id: String,
    prompt_version: Option<String>,
) -> Result<serde_json::Value, String> {
    let api_key = KeyringSecretStore
        .get()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| AiError::NoKeyConfigured.to_string())?;

    let app_local_data_dir = app.path().app_local_data_dir().map_err(|e| e.to_string())?;
    let settings = settings::read_settings(&ai_settings_path(&app)?);
    let usage_before = usage::read_usage(&app_local_data_dir);
    let month_key = usage::current_month_key(chrono::Utc::now());
    let spent_this_month = usage::month_total(&usage_before, &month_key).cost_usd;

    if let Some(cap) = settings.spend_cap_usd {
        if spent_this_month >= cap {
            return Err(AiError::SpendCapExceeded {
                limit_usd: cap,
                spent_usd: spent_this_month,
            }
            .to_string());
        }
    }

    let provider = VorionProvider::new(api_key);
    let result = provider
        .complete_structured(StructuredRequest {
            prompt,
            schema,
            model_id: model_id.clone(),
            redaction,
        })
        .await
        .map_err(|e| e.to_string())?;

    // §2.4: the real Synchronous Prediction response carries no cost field
    // (`result.usage.cost_usd` is always `None` here, see `vorion::
    // completion_usage_from_response`'s own doc comment) — a dollar figure
    // only gets computed when a spend cap is actually configured, so the
    // common case (no cap set) never pays the extra `List LLMs` round trip
    // `estimate_cost_usd` would otherwise cost on every single completion.
    let usage = if settings.spend_cap_usd.is_some() {
        match provider.estimate_cost_usd(&model_id, &result.usage).await {
            Ok(Some(cost_usd)) => CompletionUsage {
                cost_usd: Some(cost_usd),
                ..result.usage
            },
            Ok(None) => result.usage,
            Err(err) => {
                eprintln!(
                    "ai-log: failed to estimate cost from model pricing for project {project_id}: {err}"
                );
                result.usage
            }
        }
    } else {
        result.usage
    };

    let entry = AiLogEntry::new(
        "vorion",
        model_id,
        prompt_version,
        usage,
        chrono::Utc::now(),
    );
    if let Err(err) = usage::append_log_entry(&app_local_data_dir, &project_id, &entry) {
        eprintln!("ai-log: failed to append log entry for project {project_id}: {err}");
    }
    let updated_usage = usage::record_usage(&usage_before, &month_key, usage);
    if let Err(err) = usage::write_usage(&app_local_data_dir, &updated_usage) {
        eprintln!("ai-log: failed to persist monthly usage totals: {err}");
    }

    Ok(result.value)
}

/// Faz 10/K4/§2.5: what Settings' permanent cost-summary display reads —
/// this project's own running total (from its `ai-log.jsonl` sidecar) and
/// the global current-calendar-month total (spanning every project), plus
/// the configured spend cap and whether it is already met. Both totals cover
/// `complete_structured` traffic only (P-53) — `ai_complete`'s free-form
/// streaming chat carries no token counts at all (D-201) and is structurally
/// outside either total; the frontend is responsible for saying so visibly
/// rather than leaving the omission silent.
#[tauri::command]
pub fn ai_get_cost_summary(app: AppHandle, project_id: String) -> Result<CostSummary, String> {
    let app_local_data_dir = app.path().app_local_data_dir().map_err(|e| e.to_string())?;
    let settings = settings::read_settings(&ai_settings_path(&app)?);
    let project = usage::read_project_totals(&app_local_data_dir, &project_id);
    let global_usage = usage::read_usage(&app_local_data_dir);
    let month_key = usage::current_month_key(chrono::Utc::now());
    let current_month = usage::month_total(&global_usage, &month_key);
    let cap_exceeded = settings
        .spend_cap_usd
        .is_some_and(|cap| current_month.cost_usd >= cap);

    Ok(CostSummary {
        project,
        current_month,
        spend_cap_usd: settings.spend_cap_usd,
        cap_exceeded,
    })
}

/// J1/SPEC.md §8.2: exposes `LlmProvider::capabilities` the same way
/// `ai_list_models`/`ai_test_connection` expose the rest of the provider's
/// facts — a key is required first, matching those two, since a
/// capabilities' claim about *this* provider only means something once it's
/// actually configured. `capabilities()` itself makes no network call; the
/// key requirement is about consistency with the rest of this file, not a
/// technical need.
#[tauri::command]
pub fn ai_capabilities() -> Result<Capabilities, String> {
    let api_key = KeyringSecretStore
        .get()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| AiError::NoKeyConfigured.to_string())?;
    Ok(VorionProvider::new(api_key).capabilities())
}

fn ai_settings_path(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    app.path()
        .app_local_data_dir()
        .map(|dir| dir.join(AI_SETTINGS_FILE_NAME))
        .map_err(|e| e.to_string())
}

/// Non-secret preferences only (`settings.rs`'s own note: never the key
/// itself) — degrades to `AiSettings::default()` on a missing or corrupt
/// file rather than erroring, the same posture `recent_list` already uses
/// for its own disposable cache (D-60).
#[tauri::command]
pub fn ai_get_settings(app: AppHandle) -> Result<AiSettings, String> {
    let path = ai_settings_path(&app)?;
    Ok(settings::read_settings(&path))
}

#[tauri::command]
pub fn ai_set_settings(app: AppHandle, settings: AiSettings) -> Result<(), String> {
    let path = ai_settings_path(&app)?;
    settings::write_settings(&path, &settings).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ai::keychain::fake::FakeSecretStore;
    use crate::ppsx::test_support::ScratchDir;

    #[test]
    fn set_key_returns_a_masked_preview_never_the_raw_key() {
        let store = FakeSecretStore::default();

        let masked = set_key_logic(&store, "nk_live_abcdefghijklmnopqrstuvwxyz1234").unwrap();

        assert!(!masked.contains("abcdefghijklmnopqrstuvwxyz1234"));
        assert!(masked.starts_with("nk_live_"));
    }

    #[test]
    fn key_status_is_none_until_a_key_is_set_then_some_masked_value() {
        let store = FakeSecretStore::default();

        assert_eq!(key_status_logic(&store).unwrap(), None);

        set_key_logic(&store, "nk_live_zzzzzzzzzzzzzzzz1234").unwrap();

        assert!(key_status_logic(&store).unwrap().is_some());
    }

    #[test]
    fn remove_key_clears_a_previously_set_key() {
        let store = FakeSecretStore::default();
        set_key_logic(&store, "nk_live_zzzzzzzzzzzzzzzz1234").unwrap();

        remove_key_logic(&store).unwrap();

        assert_eq!(key_status_logic(&store).unwrap(), None);
    }

    /// CLAUDE.md: "write a test that asserts a known key string appears
    /// nowhere in any produced artifact." `ai::commands` and `ppsx::archive`
    /// share no state and no code path — this proves that empirically by
    /// actually writing a `.ppsx` after a key is set and inspecting the real
    /// bytes on disk, rather than only reasoning "they're separate modules."
    #[test]
    fn a_saved_key_never_appears_in_a_produced_ppsx_file() {
        let fake_raw_value = "nk_live_this_is_a_fake_test_only_key";
        let store = FakeSecretStore::default();
        set_key_logic(&store, fake_raw_value).unwrap();

        let dir = ScratchDir::new("ai_key_leak_into_ppsx");
        let ppsx_path = dir.path().join("project.ppsx");
        crate::ppsx::write_ppsx(
            &ppsx_path,
            &serde_json::json!({"id": "p1", "schemaVersion": 1, "appVersion": "0.1.0"}),
            &serde_json::json!({"id": "p1", "schemaVersion": 1, "meta": {"title": "Test"}}),
            &[],
            None,
        )
        .unwrap();

        let bytes = std::fs::read(&ppsx_path).unwrap();
        let haystack = String::from_utf8_lossy(&bytes);
        assert!(
            !haystack.contains(fake_raw_value),
            "the API key leaked into the produced .ppsx file"
        );
    }

    #[test]
    fn settings_round_trip_through_the_same_read_write_pair_the_commands_use() {
        let dir = ScratchDir::new("ai_settings_commands_roundtrip");
        let path = dir.path().join(AI_SETTINGS_FILE_NAME);
        let settings = AiSettings {
            enabled: true,
            default_model_id: Some("openai/gpt-4o".to_string()),
            fast_model_id: None,
            spend_cap_usd: None,
        };

        settings::write_settings(&path, &settings).unwrap();
        let read_back = settings::read_settings(&path);

        assert_eq!(read_back, settings);
    }
}
