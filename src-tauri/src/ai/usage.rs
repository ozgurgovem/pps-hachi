use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::io::Write;
use std::path::{Path, PathBuf};

use super::error::AiError;
use super::provider::CompletionUsage;
use crate::path_safety::is_safe_path_component;

/// Faz 10/K4/§2.2: `ai-log.jsonl`, kept as a **sidecar** under
/// `app_local_data_dir` — Barış's own choice (D-74's precedent: the history
/// snapshot sidecar is also "an audit/rollback aid, not project data," and a
/// `.ppsx` file is emailed to customers and auditors, D-06; every AI request
/// triggering a full `write_ppsx` archive rewrite would fight D-72's own
/// autosave-coalescing discipline for no real benefit). This is a deliberate
/// departure from SPEC.md §8.13's literal "an `ai-log.jsonl` inside the
/// `.ppsx`" wording — recorded in DECISIONS.md, the same "SPEC was wrong,
/// corrected" discipline D-27/D-95 already established.
///
/// One append-only `.jsonl` file per project, keyed by `project_id` — the
/// same untrusted-input path-safety concern `ppsx::history` already solved
/// (D-91/D-92), reused via `crate::path_safety` rather than re-derived.
const AI_LOG_DIR_NAME: &str = "ai-log";
const AI_LOG_EXTENSION: &str = ".jsonl";
const AI_USAGE_FILE_NAME: &str = "ai-usage.json";

/// One `complete_structured` request — SPEC.md §8.13's own field list.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AiLogEntry {
    pub timestamp: String,
    pub provider: String,
    pub model_id: String,
    pub prompt_version: Option<String>,
    pub input_tokens: Option<u64>,
    pub output_tokens: Option<u64>,
    pub cost_usd: Option<f64>,
    /// Always `None` at write time — `ai_complete_structured` has no return
    /// channel back into TS beyond the parsed value itself (§2.1's chosen
    /// plumbing), so nothing here yet correlates a logged request with the
    /// human's later Accept/Reject decision. A real correlation mechanism
    /// (a log-entry id round-tripped back to TS, then reported on Accept/
    /// Reject) is a second mechanism this dilim's own budget doesn't cover —
    /// filed as its own gap rather than half-built.
    pub accepted: Option<bool>,
}

impl AiLogEntry {
    pub fn new(
        provider: impl Into<String>,
        model_id: impl Into<String>,
        prompt_version: Option<String>,
        usage: CompletionUsage,
        now: DateTime<Utc>,
    ) -> Self {
        Self {
            timestamp: now.to_rfc3339(),
            provider: provider.into(),
            model_id: model_id.into(),
            prompt_version,
            input_tokens: usage.input_tokens,
            output_tokens: usage.output_tokens,
            cost_usd: usage.cost_usd,
            accepted: None,
        }
    }
}

fn ai_log_path(app_local_data_dir: &Path, project_id: &str) -> Result<PathBuf, AiError> {
    if !is_safe_path_component(project_id) {
        return Err(AiError::UnsafeEntryName(project_id.to_string()));
    }
    Ok(app_local_data_dir
        .join(AI_LOG_DIR_NAME)
        .join(format!("{project_id}{AI_LOG_EXTENSION}")))
}

/// Best-effort by design at the call site (`ai::commands::ai_complete_structured`
/// logs and discards a failure here rather than propagating it) — a real,
/// successful AI response must never be lost because its *audit log* write
/// failed (SPEC.md §8.14's "none of them may lose user data" applies to the
/// log's own reliability too, not just the completion itself).
pub fn append_log_entry(
    app_local_data_dir: &Path,
    project_id: &str,
    entry: &AiLogEntry,
) -> Result<(), AiError> {
    let path = ai_log_path(app_local_data_dir, project_id)?;
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let mut line = serde_json::to_string(entry)?;
    line.push('\n');
    let mut file = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&path)?;
    file.write_all(line.as_bytes())?;
    Ok(())
}

/// A running total — summed fresh from the log every time, never cached.
/// Degrades to all-zero on a missing/unreadable log (a cache, never a source
/// of truth, the same posture `ai::settings`/`ppsx::recent_index` already
/// take for their own disposable files); one malformed *line* is skipped
/// rather than aborting the whole read, so a single corrupt entry never
/// hides every real one before or after it.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub struct CostTotals {
    pub input_tokens: u64,
    pub output_tokens: u64,
    pub cost_usd: f64,
    pub request_count: u64,
}

impl CostTotals {
    fn add_entry(&mut self, entry: &AiLogEntry) {
        self.input_tokens += entry.input_tokens.unwrap_or(0);
        self.output_tokens += entry.output_tokens.unwrap_or(0);
        self.cost_usd += entry.cost_usd.unwrap_or(0.0);
        self.request_count += 1;
    }
}

/// §2.3: "per-project running total" — read directly from this project's own
/// log, no separate accumulator file (unlike the global per-month total
/// below, which spans many projects and cannot be derived from any single
/// project's log alone).
pub fn read_project_totals(app_local_data_dir: &Path, project_id: &str) -> CostTotals {
    let Ok(path) = ai_log_path(app_local_data_dir, project_id) else {
        return CostTotals::default();
    };
    let Ok(contents) = std::fs::read_to_string(&path) else {
        return CostTotals::default();
    };
    let mut totals = CostTotals::default();
    for line in contents.lines() {
        if line.trim().is_empty() {
            continue;
        }
        if let Ok(entry) = serde_json::from_str::<AiLogEntry>(line) {
            totals.add_entry(&entry);
        }
    }
    totals
}

/// §2.3: the global, cross-project per-calendar-month accumulator SPEC.md
/// §8.12's "per-month running total" needs — no single project's log can
/// answer this on its own, since an engineer may work across several open
/// `.ppsx` files in one month. Lives beside `ai-settings.json`
/// (`ai::settings`'s own file, same directory) rather than inside any one
/// project's sidecar.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub struct AiUsage {
    /// Keyed by `"YYYY-MM"` (UTC calendar month). `BTreeMap` for
    /// deterministic serialization order only — ordering carries no runtime
    /// meaning, `month_total` always looks up by exact key.
    pub months: BTreeMap<String, CostTotals>,
}

fn ai_usage_path(app_local_data_dir: &Path) -> PathBuf {
    app_local_data_dir.join(AI_USAGE_FILE_NAME)
}

/// Degrades to `AiUsage::default()` on a missing or corrupt file — the same
/// posture `ai::settings::read_settings` already established; losing this
/// file costs a reset running-total display, never project data.
pub fn read_usage(app_local_data_dir: &Path) -> AiUsage {
    std::fs::read(ai_usage_path(app_local_data_dir))
        .ok()
        .and_then(|bytes| serde_json::from_slice::<AiUsage>(&bytes).ok())
        .unwrap_or_default()
}

pub fn write_usage(app_local_data_dir: &Path, usage: &AiUsage) -> Result<(), AiError> {
    let path = ai_usage_path(app_local_data_dir);
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let bytes = serde_json::to_vec_pretty(usage)?;
    std::fs::write(&path, bytes)?;
    Ok(())
}

pub fn current_month_key(now: DateTime<Utc>) -> String {
    now.format("%Y-%m").to_string()
}

pub fn month_total(usage: &AiUsage, month_key: &str) -> CostTotals {
    usage.months.get(month_key).copied().unwrap_or_default()
}

/// §2.5: what `ai::commands::ai_get_cost_summary` returns to TS — Settings'
/// permanent cost-summary display reads this directly, no further Rust-side
/// shaping needed at the IPC boundary.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CostSummary {
    pub project: CostTotals,
    pub current_month: CostTotals,
    pub spend_cap_usd: Option<f64>,
    pub cap_exceeded: bool,
}

/// Pure — returns a **new** `AiUsage` with `month_key`'s totals incremented,
/// this crate's own immutable-update convention (never mutates `usage`
/// itself). The caller (`ai::commands::ai_complete_structured`) is
/// responsible for persisting the result via `write_usage`.
pub fn record_usage(usage: &AiUsage, month_key: &str, usage_delta: CompletionUsage) -> AiUsage {
    let mut months = usage.months.clone();
    let totals = months.entry(month_key.to_string()).or_default();
    totals.input_tokens += usage_delta.input_tokens.unwrap_or(0);
    totals.output_tokens += usage_delta.output_tokens.unwrap_or(0);
    totals.cost_usd += usage_delta.cost_usd.unwrap_or(0.0);
    totals.request_count += 1;
    AiUsage { months }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ppsx::test_support::ScratchDir;

    fn sample_usage() -> CompletionUsage {
        CompletionUsage {
            input_tokens: Some(120),
            output_tokens: Some(45),
            cost_usd: Some(0.0031),
        }
    }

    #[test]
    fn append_log_entry_rejects_a_project_id_that_looks_like_path_traversal() {
        let dir = ScratchDir::new("ai_usage_log_traversal");
        let entry = AiLogEntry::new("vorion", "openai/gpt-4o", None, sample_usage(), Utc::now());

        let err = append_log_entry(dir.path(), "../../../etc", &entry).unwrap_err();

        assert!(matches!(err, AiError::UnsafeEntryName(_)), "{err:?}");
    }

    #[test]
    fn read_project_totals_is_zero_when_no_log_exists_yet() {
        let dir = ScratchDir::new("ai_usage_project_totals_missing");

        assert_eq!(
            read_project_totals(dir.path(), "proj-1"),
            CostTotals::default()
        );
    }

    #[test]
    fn append_then_read_project_totals_sums_every_entry() {
        let dir = ScratchDir::new("ai_usage_project_totals_roundtrip");
        let entry_a = AiLogEntry::new(
            "vorion",
            "openai/gpt-4o",
            Some("pareto.v1".to_string()),
            sample_usage(),
            Utc::now(),
        );
        let entry_b = AiLogEntry::new(
            "vorion",
            "openai/gpt-4o",
            Some("layout-review.v1".to_string()),
            CompletionUsage {
                input_tokens: Some(300),
                output_tokens: Some(80),
                cost_usd: Some(0.0075),
            },
            Utc::now(),
        );

        append_log_entry(dir.path(), "proj-1", &entry_a).unwrap();
        append_log_entry(dir.path(), "proj-1", &entry_b).unwrap();

        let totals = read_project_totals(dir.path(), "proj-1");

        assert_eq!(totals.input_tokens, 420);
        assert_eq!(totals.output_tokens, 125);
        assert!((totals.cost_usd - 0.0106).abs() < 1e-9);
        assert_eq!(totals.request_count, 2);
    }

    #[test]
    fn append_log_entry_never_leaks_a_previous_project_s_entries_into_a_different_project_s_log() {
        let dir = ScratchDir::new("ai_usage_project_isolation");
        let entry = AiLogEntry::new("vorion", "openai/gpt-4o", None, sample_usage(), Utc::now());

        append_log_entry(dir.path(), "proj-a", &entry).unwrap();

        assert_eq!(
            read_project_totals(dir.path(), "proj-b"),
            CostTotals::default()
        );
    }

    #[test]
    fn read_project_totals_skips_a_malformed_line_rather_than_returning_nothing() {
        let dir = ScratchDir::new("ai_usage_project_totals_corrupt_line");
        let entry = AiLogEntry::new("vorion", "openai/gpt-4o", None, sample_usage(), Utc::now());
        append_log_entry(dir.path(), "proj-1", &entry).unwrap();
        // Plant one genuinely malformed line in the middle of the file.
        let path = dir.path().join("ai-log").join("proj-1.jsonl");
        let mut contents = std::fs::read_to_string(&path).unwrap();
        contents.push_str("{ not json at all\n");
        std::fs::write(&path, contents).unwrap();
        append_log_entry(dir.path(), "proj-1", &entry).unwrap();

        let totals = read_project_totals(dir.path(), "proj-1");

        assert_eq!(totals.request_count, 2);
    }

    #[test]
    fn read_usage_returns_default_when_file_missing() {
        let dir = ScratchDir::new("ai_usage_missing");
        assert_eq!(read_usage(dir.path()), AiUsage::default());
    }

    #[test]
    fn read_usage_returns_default_when_file_is_corrupt_json() {
        let dir = ScratchDir::new("ai_usage_corrupt");
        std::fs::write(dir.path().join(AI_USAGE_FILE_NAME), b"{ not json").unwrap();
        assert_eq!(read_usage(dir.path()), AiUsage::default());
    }

    #[test]
    fn write_then_read_usage_round_trips() {
        let dir = ScratchDir::new("ai_usage_roundtrip");
        let usage = record_usage(&AiUsage::default(), "2026-09", sample_usage());

        write_usage(dir.path(), &usage).unwrap();

        assert_eq!(read_usage(dir.path()), usage);
    }

    #[test]
    fn record_usage_does_not_mutate_the_original() {
        let original = AiUsage::default();

        let updated = record_usage(&original, "2026-09", sample_usage());

        assert_eq!(original, AiUsage::default());
        assert_ne!(updated, original);
    }

    #[test]
    fn record_usage_accumulates_across_multiple_calls_in_the_same_month() {
        let usage = record_usage(&AiUsage::default(), "2026-09", sample_usage());
        let usage = record_usage(&usage, "2026-09", sample_usage());

        let totals = month_total(&usage, "2026-09");

        assert_eq!(totals.input_tokens, 240);
        assert_eq!(totals.output_tokens, 90);
        assert!((totals.cost_usd - 0.0062).abs() < 1e-9);
        assert_eq!(totals.request_count, 2);
    }

    #[test]
    fn record_usage_keeps_separate_months_independent() {
        let usage = record_usage(&AiUsage::default(), "2026-08", sample_usage());
        let usage = record_usage(&usage, "2026-09", sample_usage());

        assert_eq!(month_total(&usage, "2026-08").request_count, 1);
        assert_eq!(month_total(&usage, "2026-09").request_count, 1);
    }

    #[test]
    fn month_total_is_zero_for_a_month_with_no_recorded_usage() {
        let usage = AiUsage::default();
        assert_eq!(month_total(&usage, "2026-09"), CostTotals::default());
    }

    #[test]
    fn current_month_key_formats_as_year_dash_month() {
        let now = DateTime::parse_from_rfc3339("2026-09-06T12:00:00Z")
            .unwrap()
            .with_timezone(&Utc);
        assert_eq!(current_month_key(now), "2026-09");
    }

    #[test]
    fn ai_log_entry_new_stamps_a_real_rfc3339_timestamp_and_leaves_accepted_unknown() {
        let now = DateTime::parse_from_rfc3339("2026-09-06T12:00:00Z")
            .unwrap()
            .with_timezone(&Utc);

        let entry = AiLogEntry::new(
            "vorion",
            "openai/gpt-4o",
            Some("pareto.v1".to_string()),
            sample_usage(),
            now,
        );

        assert_eq!(entry.timestamp, "2026-09-06T12:00:00+00:00");
        assert_eq!(entry.accepted, None);
        assert_eq!(entry.provider, "vorion");
    }
}
