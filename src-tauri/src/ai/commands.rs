use tauri::ipc::Channel;
use tauri::{AppHandle, Manager};

use super::error::AiError;
use super::keychain::{masked_preview, KeyringSecretStore, SecretStore};
use super::provider::{
    CancelResult, Capabilities, CompletionMeta, CompletionRequest, ConnectionStatus, LlmProvider,
    ModelInfo, StreamEvent, StructuredRequest,
};
use super::settings::{self, AiSettings};
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
#[tauri::command]
pub async fn ai_complete(
    prompt: String,
    model_id: String,
    channel: Channel<StreamEvent>,
) -> Result<CompletionMeta, String> {
    let api_key = KeyringSecretStore
        .get()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| AiError::NoKeyConfigured.to_string())?;
    VorionProvider::new(api_key)
        .complete(CompletionRequest { prompt, model_id }, channel)
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
#[tauri::command]
pub async fn ai_complete_structured(
    prompt: String,
    schema: serde_json::Value,
    model_id: String,
) -> Result<serde_json::Value, String> {
    let api_key = KeyringSecretStore
        .get()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| AiError::NoKeyConfigured.to_string())?;
    VorionProvider::new(api_key)
        .complete_structured(StructuredRequest {
            prompt,
            schema,
            model_id,
        })
        .await
        .map_err(|e| e.to_string())
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
        };

        settings::write_settings(&path, &settings).unwrap();
        let read_back = settings::read_settings(&path);

        assert_eq!(read_back, settings);
    }
}
