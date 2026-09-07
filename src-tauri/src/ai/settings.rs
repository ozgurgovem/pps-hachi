use serde::{Deserialize, Serialize};
use std::path::Path;

/// Non-secret, app-level AI preferences — the key itself never lives here
/// (that's `keychain.rs`'s job, OS keychain only, D-14). A torn/corrupt write
/// just resets these three fields to their defaults on next read, the same
/// low-stakes degrade-to-default posture `ppsx::recent_index` already uses
/// for its own disposable cache (D-60) — unlike a `.ppsx` project or the
/// history sidecar, losing this file costs the user re-picking a default
/// model, not project data, so it doesn't need `ppsx::atomic`'s crash-safe
/// rename.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AiSettings {
    pub enabled: bool,
    pub default_model_id: Option<String>,
    pub fast_model_id: Option<String>,
    /// Faz 10/K4/§2.4: `None` = unlimited, the same `Option`-as-"unset"
    /// convention `default_model_id`/`fast_model_id` already use. A global,
    /// per-calendar-month USD ceiling on `complete_structured` traffic only
    /// (P-53 — `ai_complete`'s free-form streaming chat has no token counts
    /// to meter at all, D-201, so it is structurally outside this cap).
    pub spend_cap_usd: Option<f64>,
}

impl Default for AiSettings {
    /// D-20: AI assistance is off by default on a fresh install.
    fn default() -> Self {
        Self {
            enabled: false,
            default_model_id: None,
            fast_model_id: None,
            spend_cap_usd: None,
        }
    }
}

pub fn read_settings(path: &Path) -> AiSettings {
    std::fs::read(path)
        .ok()
        .and_then(|bytes| serde_json::from_slice::<AiSettings>(&bytes).ok())
        .unwrap_or_default()
}

pub fn write_settings(path: &Path, settings: &AiSettings) -> std::io::Result<()> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let bytes =
        serde_json::to_vec_pretty(settings).expect("AiSettings serialization is infallible");
    std::fs::write(path, bytes)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ppsx::test_support::ScratchDir;

    #[test]
    fn read_settings_returns_defaults_when_file_missing() {
        let dir = ScratchDir::new("ai_settings_missing");
        let path = dir.path().join("ai-settings.json");

        assert_eq!(read_settings(&path), AiSettings::default());
    }

    #[test]
    fn read_settings_returns_defaults_when_file_is_corrupt_json() {
        let dir = ScratchDir::new("ai_settings_corrupt");
        let path = dir.path().join("ai-settings.json");
        std::fs::write(&path, b"{ not json at all").unwrap();

        assert_eq!(read_settings(&path), AiSettings::default());
    }

    #[test]
    fn write_then_read_round_trips_all_fields() {
        let dir = ScratchDir::new("ai_settings_roundtrip");
        let path = dir.path().join("ai-settings.json");
        let settings = AiSettings {
            enabled: true,
            default_model_id: Some("openai/gpt-4o".to_string()),
            fast_model_id: Some("groq/llama-3.1-8b".to_string()),
            spend_cap_usd: Some(25.5),
        };

        write_settings(&path, &settings).unwrap();

        assert_eq!(read_settings(&path), settings);
    }

    #[test]
    fn write_settings_creates_missing_parent_directories() {
        let dir = ScratchDir::new("ai_settings_missing_parent");
        let path = dir.path().join("nested").join("ai-settings.json");

        write_settings(&path, &AiSettings::default()).unwrap();

        assert!(path.exists());
    }
}
