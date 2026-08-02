use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

use super::archive::{self, ArchiveEntry, PpsxContents};
use super::error::PpsxError;
use super::history;
use super::recent_index::{self, RecentEntry};

/// D-60: app-local-data-dir, not a user-visible location — this is a cache,
/// not a project file the user is expected to find or move.
const RECENT_INDEX_FILE_NAME: &str = "recent-projects.json";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArchiveEntryPayload {
    pub name: String,
    pub bytes: Vec<u8>,
}

impl From<ArchiveEntry> for ArchiveEntryPayload {
    fn from(entry: ArchiveEntry) -> Self {
        Self {
            name: entry.name,
            bytes: entry.bytes,
        }
    }
}

impl From<ArchiveEntryPayload> for ArchiveEntry {
    fn from(entry: ArchiveEntryPayload) -> Self {
        Self {
            name: entry.name,
            bytes: entry.bytes,
        }
    }
}

// `#[tauri::command]` auto-converts *parameter* names to camelCase for the
// JS side (e.g. `ppsx_write`'s `other_entries` param becomes `otherEntries`
// automatically), but that conversion doesn't reach struct fields returned
// from a command — `serde`'s own `rename_all` is what keeps this response
// body consistent with the rest of the TS codebase's camelCase convention.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PpsxReadPayload {
    pub manifest: serde_json::Value,
    pub project: serde_json::Value,
    pub other_entries: Vec<ArchiveEntryPayload>,
    /// D-77: what the caller must pass back as `expectedModifiedMs` on the
    /// next `ppsx_write` for this file, so a concurrent writer elsewhere
    /// (D-06: `.ppsx` files live on shared plant drives) is detected instead
    /// of silently overwritten.
    pub modified_ms: u64,
}

/// Writes (creates or overwrites) a `.ppsx`. The caller supplies already
/// Zod-validated `manifest`/`project` JSON — Rust re-derives nothing from it
/// beyond the D-54 routing-id check `write_ppsx` already performs. Returns
/// the file's new mtime so the caller can chain the next write's
/// `expectedModifiedMs` off this one.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PpsxWritePayload {
    pub modified_ms: u64,
}

fn to_read_payload(contents: PpsxContents, modified_ms: u64) -> PpsxReadPayload {
    PpsxReadPayload {
        manifest: contents.manifest,
        project: contents.project,
        other_entries: contents.other_entries.into_iter().map(Into::into).collect(),
        modified_ms,
    }
}

/// D-77: a `Conflict` is a distinct, expected outcome the frontend must be
/// able to tell apart from a generic I/O failure (different UI: "not saved —
/// file changed on disk" vs. a sticky error) without Tauri's `invoke()`
/// giving structured errors — a stable string prefix is the cheapest way to
/// keep that distinguishable across the IPC boundary.
const CONFLICT_ERROR_PREFIX: &str = "CONFLICT:";

fn map_write_error(error: PpsxError) -> String {
    match error {
        PpsxError::Conflict { .. } => format!("{CONFLICT_ERROR_PREFIX} {error}"),
        other => other.to_string(),
    }
}

/// Opens a `.ppsx` from anywhere on disk — D-61: this is also what "Import
/// .ppsx" means, there is no separate import path. Rust hands back raw JSON;
/// Zod-validating and migrating `project` against `manifest.schemaVersion`
/// is the caller's job (D-55, D-57).
#[tauri::command]
pub fn ppsx_read(path: String) -> Result<PpsxReadPayload, String> {
    let path = std::path::Path::new(&path);
    let contents = archive::read_ppsx(path).map_err(|e| e.to_string())?;
    let modified_ms = archive::file_modified_ms(path).map_err(|e| e.to_string())?;
    Ok(to_read_payload(contents, modified_ms))
}

#[tauri::command]
pub fn ppsx_write(
    path: String,
    manifest: serde_json::Value,
    project: serde_json::Value,
    other_entries: Vec<ArchiveEntryPayload>,
    expected_modified_ms: Option<u64>,
) -> Result<PpsxWritePayload, String> {
    let entries: Vec<ArchiveEntry> = other_entries.into_iter().map(Into::into).collect();
    archive::write_ppsx(
        std::path::Path::new(&path),
        &manifest,
        &project,
        &entries,
        expected_modified_ms,
    )
    .map(|modified_ms| PpsxWritePayload { modified_ms })
    .map_err(map_write_error)
}

fn history_dir(app: &AppHandle, project_id: &str) -> Result<std::path::PathBuf, String> {
    let dir = app.path().app_local_data_dir().map_err(|e| e.to_string())?;
    history::resolve_history_dir(&dir, project_id).map_err(|e| e.to_string())
}

/// D-74/D-75: history snapshots are a sidecar in app-local-data-dir, never
/// inside the `.ppsx` itself. Newest-first list of timestamps only — the
/// caller fetches a snapshot's content with `history_read` only when the
/// user actually opens the restore picker, not on every list refresh.
#[tauri::command]
pub fn history_list(app: AppHandle, project_id: String) -> Result<Vec<String>, String> {
    let dir = history_dir(&app, &project_id)?;
    Ok(history::list_snapshots(&dir))
}

/// Called on every autosave tick that actually writes (D-72's dirty gate) —
/// `keep_last` is the caller's policy (D-75: 20), not hardcoded in Rust.
#[tauri::command]
pub fn history_save(
    app: AppHandle,
    project_id: String,
    timestamp: String,
    project: serde_json::Value,
    keep_last: u32,
) -> Result<(), String> {
    let dir = history_dir(&app, &project_id)?;
    history::write_snapshot(&dir, &timestamp, &project, keep_last as usize)
        .map_err(|e| e.to_string())
}

/// D-5/D-76: returns the raw, unvalidated snapshot JSON — restoring it runs
/// through the exact same migrate + Zod-validate + id-check pipeline as
/// opening a file, which is the caller's job, not Rust's (D-55).
#[tauri::command]
pub fn history_read(
    app: AppHandle,
    project_id: String,
    timestamp: String,
) -> Result<serde_json::Value, String> {
    let dir = history_dir(&app, &project_id)?;
    history::read_snapshot(&dir, &timestamp).map_err(|e| e.to_string())
}

fn recent_index_path(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    app.path()
        .app_local_data_dir()
        .map(|dir| dir.join(RECENT_INDEX_FILE_NAME))
        .map_err(|e| e.to_string())
}

/// The launch screen's recent list — D-60/§4.3: works without opening every
/// file. Lazily prunes entries whose file has moved or been deleted (D-61).
#[tauri::command]
pub fn recent_list(app: AppHandle) -> Result<Vec<RecentEntry>, String> {
    let path = recent_index_path(&app)?;
    Ok(recent_index::list_recent(&path))
}

/// Called after a successful create/open/save so the project just touched
/// becomes the most-recent entry. Returns the updated list so the launch
/// screen can render it without a second round trip.
#[tauri::command]
pub fn recent_upsert(app: AppHandle, entry: RecentEntry) -> Result<Vec<RecentEntry>, String> {
    let path = recent_index_path(&app)?;
    let existing = recent_index::list_recent(&path);
    let updated = recent_index::upsert(existing, entry);
    recent_index::write_recent_index(&path, &updated).map_err(|e| e.to_string())?;
    Ok(updated)
}
