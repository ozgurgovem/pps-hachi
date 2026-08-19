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

/// D-118/D-193: the frontend never reads or holds the raw source photo's
/// bytes — Rust takes a path and does the whole decode/orient/strip/
/// downscale/thumbnail pipeline itself (`crate::images::ingest_image_bytes`).
/// The write itself reuses `write_ppsx` (D-64/D-67/D-91/D-92's hardened,
/// unmodified path) rather than a new write mechanism: `other_entries` is
/// exactly what an ordinary `ppsx_write` call would receive, plus these two
/// new asset entries appended. `manifest`/`project`/`expected_modified_ms`
/// carry the same meaning as `ppsx_write`'s — this call is also a full,
/// immediate project save (D-118: "writes... immediately"), not merely an
/// image-processing step.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImageRefPayload {
    pub id: String,
    pub asset_path: String,
    pub thumbnail_path: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImageImportPayload {
    pub image_ref: ImageRefPayload,
    /// Folded into the caller's in-memory `otherEntries` so the *next*
    /// ordinary `ppsx_write` (autosave) keeps including them — this command
    /// does not change `write_ppsx`'s full-replace contract, so anything not
    /// in that array on a later write would be silently dropped.
    pub original_entry: ArchiveEntryPayload,
    pub thumbnail_entry: ArchiveEntryPayload,
    pub modified_ms: u64,
}

/// D-193: `image_id` is generated by the caller (`crypto.randomUUID()`, the
/// same convention `builders.ts` already uses for every other id in this
/// codebase) rather than by a new Rust-side uuid dependency — it is trusted
/// the same way any other locally-generated, non-`.ppsx`-sourced id is, and
/// `write_ppsx`'s own `is_safe_relative_name`/`MAX_ENTRY_NAME_BYTES` checks
/// (D-67/D-93) still run unconditionally on the resulting entry names below,
/// exactly as they do for every other entry.
#[tauri::command]
pub fn image_import(
    ppsx_path: String,
    source_path: String,
    image_id: String,
    manifest: serde_json::Value,
    project: serde_json::Value,
    other_entries: Vec<ArchiveEntryPayload>,
    expected_modified_ms: Option<u64>,
) -> Result<ImageImportPayload, String> {
    let source_bytes = std::fs::read(&source_path).map_err(|e| format!("{source_path}: {e}"))?;
    let ingested = crate::images::ingest_image_bytes(&source_bytes).map_err(|e| e.to_string())?;

    let asset_name = format!("assets/img_{image_id}.jpg");
    let thumbnail_name = format!("assets/thumb_{image_id}.jpg");

    let mut entries: Vec<ArchiveEntry> = other_entries.into_iter().map(Into::into).collect();
    entries.push(ArchiveEntry {
        name: asset_name.clone(),
        bytes: ingested.original.clone(),
    });
    entries.push(ArchiveEntry {
        name: thumbnail_name.clone(),
        bytes: ingested.thumbnail.clone(),
    });

    let modified_ms = archive::write_ppsx(
        std::path::Path::new(&ppsx_path),
        &manifest,
        &project,
        &entries,
        expected_modified_ms,
    )
    .map_err(map_write_error)?;

    Ok(ImageImportPayload {
        image_ref: ImageRefPayload {
            id: image_id,
            asset_path: asset_name.clone(),
            thumbnail_path: thumbnail_name.clone(),
        },
        original_entry: ArchiveEntryPayload {
            name: asset_name,
            bytes: ingested.original,
        },
        thumbnail_entry: ArchiveEntryPayload {
            name: thumbnail_name,
            bytes: ingested.thumbnail,
        },
        modified_ms,
    })
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

#[cfg(test)]
mod image_import_tests {
    use super::*;
    use crate::ppsx::test_support::ScratchDir;
    use serde_json::json;

    fn sample_manifest() -> serde_json::Value {
        json!({ "id": "proj-1", "schemaVersion": 1, "appVersion": "0.1.0" })
    }

    fn sample_project() -> serde_json::Value {
        json!({ "id": "proj-1", "schemaVersion": 1, "meta": { "title": "Örnek Proje" } })
    }

    fn write_synthetic_jpeg(path: &std::path::Path, width: u32, height: u32) {
        let img = image::RgbImage::from_fn(width, height, |x, y| {
            image::Rgb([(x % 256) as u8, (y % 256) as u8, 128])
        });
        image::DynamicImage::ImageRgb8(img)
            .save_with_format(path, image::ImageFormat::Jpeg)
            .unwrap();
    }

    #[test]
    fn writes_the_image_into_a_fresh_ppsx_and_it_round_trips_via_read_ppsx() {
        let dir = ScratchDir::new("image_import_fresh");
        let ppsx_path = dir.path().join("project.ppsx");
        let source_path = dir.path().join("photo.jpg");
        write_synthetic_jpeg(&source_path, 3000, 2000);

        let result = image_import(
            ppsx_path.to_string_lossy().to_string(),
            source_path.to_string_lossy().to_string(),
            "img-1".to_string(),
            sample_manifest(),
            sample_project(),
            vec![],
            None,
        )
        .unwrap();

        assert_eq!(result.image_ref.id, "img-1");
        assert_eq!(result.image_ref.asset_path, "assets/img_img-1.jpg");
        assert_eq!(result.image_ref.thumbnail_path, "assets/thumb_img-1.jpg");

        let read_back = archive::read_ppsx(&ppsx_path).unwrap();
        let names: Vec<&str> = read_back
            .other_entries
            .iter()
            .map(|e| e.name.as_str())
            .collect();
        assert!(names.contains(&"assets/img_img-1.jpg"));
        assert!(names.contains(&"assets/thumb_img-1.jpg"));

        let original_entry = read_back
            .other_entries
            .iter()
            .find(|e| e.name == "assets/img_img-1.jpg")
            .unwrap();
        let decoded = image::load_from_memory(&original_entry.bytes).unwrap();
        assert_eq!(decoded.width(), crate::images::ORIGINAL_MAX_LONG_EDGE);
    }

    #[test]
    fn returns_a_modified_ms_that_chains_into_a_normal_ppsx_write() {
        let dir = ScratchDir::new("image_import_chain");
        let ppsx_path = dir.path().join("project.ppsx");
        let source_path = dir.path().join("photo.jpg");
        write_synthetic_jpeg(&source_path, 200, 150);

        let imported = image_import(
            ppsx_path.to_string_lossy().to_string(),
            source_path.to_string_lossy().to_string(),
            "img-2".to_string(),
            sample_manifest(),
            sample_project(),
            vec![],
            None,
        )
        .unwrap();

        // A normal ppsx_write, chaining expected_modified_ms off image_import's
        // own result, must still succeed — image_import must not leave the
        // compare-and-swap state (D-77) in some special/inconsistent shape.
        let entries: Vec<ArchiveEntryPayload> = vec![
            ArchiveEntryPayload {
                name: imported.original_entry.name.clone(),
                bytes: imported.original_entry.bytes.clone(),
            },
            ArchiveEntryPayload {
                name: imported.thumbnail_entry.name.clone(),
                bytes: imported.thumbnail_entry.bytes.clone(),
            },
        ];
        let next = ppsx_write(
            ppsx_path.to_string_lossy().to_string(),
            sample_manifest(),
            sample_project(),
            entries,
            Some(imported.modified_ms),
        );
        assert!(next.is_ok(), "{next:?}");
    }

    #[test]
    fn rejects_with_conflict_when_expected_modified_ms_is_stale() {
        let dir = ScratchDir::new("image_import_conflict");
        let ppsx_path = dir.path().join("project.ppsx");
        let source_path = dir.path().join("photo.jpg");
        write_synthetic_jpeg(&source_path, 100, 100);

        // A first write establishes a real mtime on disk.
        ppsx_write(
            ppsx_path.to_string_lossy().to_string(),
            sample_manifest(),
            sample_project(),
            vec![],
            None,
        )
        .unwrap();

        let err = image_import(
            ppsx_path.to_string_lossy().to_string(),
            source_path.to_string_lossy().to_string(),
            "img-3".to_string(),
            sample_manifest(),
            sample_project(),
            vec![],
            Some(1), // definitely stale
        )
        .unwrap_err();

        assert!(err.starts_with(CONFLICT_ERROR_PREFIX), "{err}");
    }

    #[test]
    fn rejects_a_source_path_that_does_not_exist() {
        let dir = ScratchDir::new("image_import_missing_source");
        let ppsx_path = dir.path().join("project.ppsx");

        let err = image_import(
            ppsx_path.to_string_lossy().to_string(),
            dir.path().join("nope.jpg").to_string_lossy().to_string(),
            "img-4".to_string(),
            sample_manifest(),
            sample_project(),
            vec![],
            None,
        )
        .unwrap_err();

        assert!(!err.is_empty());
        assert!(!ppsx_path.exists());
    }

    /// D-64/D-67/D-91/D-92's discipline inherited, not reinvented: a
    /// crafted `image_id` that smuggles path-traversal segments into the
    /// derived entry name is rejected by `write_ppsx`'s existing
    /// `is_safe_relative_name` check — no new validation was written for
    /// this command, and this proves the inherited one actually fires
    /// rather than merely being cited in a comment.
    #[test]
    fn rejects_an_image_id_that_smuggles_a_path_traversal_segment() {
        let dir = ScratchDir::new("image_import_traversal_id");
        let ppsx_path = dir.path().join("project.ppsx");
        let source_path = dir.path().join("photo.jpg");
        write_synthetic_jpeg(&source_path, 50, 50);

        let err = image_import(
            ppsx_path.to_string_lossy().to_string(),
            source_path.to_string_lossy().to_string(),
            "x/../../evil".to_string(),
            sample_manifest(),
            sample_project(),
            vec![],
            None,
        )
        .unwrap_err();

        assert!(
            err.contains("unsafe entry name") || err.contains("UnsafeEntryName"),
            "{err}"
        );
        assert!(
            !ppsx_path.exists(),
            "a rejected write must not touch the file"
        );
    }

    #[test]
    fn preserves_previously_imported_images_when_a_second_image_is_imported() {
        let dir = ScratchDir::new("image_import_second_image");
        let ppsx_path = dir.path().join("project.ppsx");
        let first_source = dir.path().join("first.jpg");
        let second_source = dir.path().join("second.jpg");
        write_synthetic_jpeg(&first_source, 100, 100);
        write_synthetic_jpeg(&second_source, 100, 100);

        let first = image_import(
            ppsx_path.to_string_lossy().to_string(),
            first_source.to_string_lossy().to_string(),
            "img-a".to_string(),
            sample_manifest(),
            sample_project(),
            vec![],
            None,
        )
        .unwrap();

        // Mirrors what the frontend actually does: fold the newly-returned
        // entries into the array it passes to the next call.
        let carried_forward = vec![
            ArchiveEntryPayload {
                name: first.original_entry.name.clone(),
                bytes: first.original_entry.bytes.clone(),
            },
            ArchiveEntryPayload {
                name: first.thumbnail_entry.name.clone(),
                bytes: first.thumbnail_entry.bytes.clone(),
            },
        ];

        image_import(
            ppsx_path.to_string_lossy().to_string(),
            second_source.to_string_lossy().to_string(),
            "img-b".to_string(),
            sample_manifest(),
            sample_project(),
            carried_forward,
            Some(first.modified_ms),
        )
        .unwrap();

        let read_back = archive::read_ppsx(&ppsx_path).unwrap();
        let names: Vec<&str> = read_back
            .other_entries
            .iter()
            .map(|e| e.name.as_str())
            .collect();
        assert!(names.contains(&"assets/img_img-a.jpg"));
        assert!(names.contains(&"assets/thumb_img-a.jpg"));
        assert!(names.contains(&"assets/img_img-b.jpg"));
        assert!(names.contains(&"assets/thumb_img-b.jpg"));
    }
}
