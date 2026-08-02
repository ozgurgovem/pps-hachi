use serde::{Deserialize, Serialize};
use std::path::Path;

use super::atomic::atomic_write;
use super::error::PpsxError;

/// D-60: the recent-projects index is a disposable cache/projection of the
/// `.ppsx` files themselves, not a source of truth — so, like `other_entries`
/// in `archive.rs`, Rust only needs the one field it acts on (`path`, for the
/// D-61 staleness prune). Everything else (title, owner, step progress,
/// thumbnail — real `ProjectModel` content) is TS/Zod's concern (D-55) and
/// round-trips through `extra` untouched.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct RecentEntry {
    pub path: String,
    #[serde(flatten)]
    pub extra: serde_json::Map<String, serde_json::Value>,
}

/// The list a launch screen renders: read the index, drop entries whose file
/// no longer exists (D-61's lazy prune), persist the pruned list if anything
/// changed, and return it. A missing or corrupt index file degrades to an
/// empty list rather than an error — D-60: "a lost or corrupt index...
/// degrade to an empty recent list, not a recovery scenario."
pub fn list_recent(index_path: &Path) -> Vec<RecentEntry> {
    let entries = read_raw(index_path);
    let (kept, dropped_any) = prune_missing(entries);

    if dropped_any {
        let _ = write_recent_index(index_path, &kept);
    }

    kept
}

/// Move `entry` to the front of the list, replacing any existing entry with
/// the same `path` (re-opening or re-saving a project refreshes its recency
/// and its cached metadata in one step).
pub fn upsert(mut entries: Vec<RecentEntry>, entry: RecentEntry) -> Vec<RecentEntry> {
    entries.retain(|existing| existing.path != entry.path);
    entries.insert(0, entry);
    entries
}

pub fn write_recent_index(index_path: &Path, entries: &[RecentEntry]) -> Result<(), PpsxError> {
    let bytes = serde_json::to_vec_pretty(entries)?;
    atomic_write(index_path, &bytes)
}

fn read_raw(index_path: &Path) -> Vec<RecentEntry> {
    std::fs::read(index_path)
        .ok()
        .and_then(|bytes| serde_json::from_slice::<Vec<RecentEntry>>(&bytes).ok())
        .unwrap_or_default()
}

/// Returns the surviving entries plus whether anything was dropped.
fn prune_missing(entries: Vec<RecentEntry>) -> (Vec<RecentEntry>, bool) {
    let original_len = entries.len();
    let kept: Vec<RecentEntry> = entries
        .into_iter()
        .filter(|entry| Path::new(&entry.path).exists())
        .collect();
    let dropped_any = kept.len() != original_len;
    (kept, dropped_any)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ppsx::test_support::ScratchDir;
    use serde_json::json;

    fn entry(path: &str, extra: serde_json::Value) -> RecentEntry {
        RecentEntry {
            path: path.to_string(),
            extra: extra.as_object().cloned().unwrap_or_default(),
        }
    }

    #[test]
    fn list_recent_returns_empty_when_file_missing() {
        let dir = ScratchDir::new("recent_missing");
        let index_path = dir.path().join("recent.json");

        assert_eq!(list_recent(&index_path), Vec::new());
    }

    #[test]
    fn list_recent_returns_empty_when_file_is_corrupt_json() {
        let dir = ScratchDir::new("recent_corrupt");
        let index_path = dir.path().join("recent.json");
        std::fs::write(&index_path, b"{ not json at all").unwrap();

        assert_eq!(list_recent(&index_path), Vec::new());
    }

    #[test]
    fn upsert_adds_new_entry_to_front() {
        let existing = vec![entry("/a.ppsx", json!({"title": "A"}))];
        let updated = upsert(existing, entry("/b.ppsx", json!({"title": "B"})));

        assert_eq!(updated.len(), 2);
        assert_eq!(updated[0].path, "/b.ppsx");
        assert_eq!(updated[1].path, "/a.ppsx");
    }

    #[test]
    fn upsert_moves_existing_entry_to_front_and_replaces_its_fields() {
        let existing = vec![
            entry("/a.ppsx", json!({"title": "A"})),
            entry("/b.ppsx", json!({"title": "B"})),
        ];
        let updated = upsert(existing, entry("/b.ppsx", json!({"title": "B renamed"})));

        assert_eq!(updated.len(), 2);
        assert_eq!(updated[0].path, "/b.ppsx");
        assert_eq!(updated[0].extra["title"], "B renamed");
        assert_eq!(updated[1].path, "/a.ppsx");
    }

    #[test]
    fn list_recent_prunes_entries_whose_file_no_longer_exists() {
        let dir = ScratchDir::new("recent_prune");
        let index_path = dir.path().join("recent.json");
        let still_there = dir.path().join("still-there.ppsx");
        std::fs::write(&still_there, b"content").unwrap();

        let entries = vec![
            entry(still_there.to_str().unwrap(), json!({"title": "Alive"})),
            entry("/nonexistent/gone.ppsx", json!({"title": "Gone"})),
        ];
        write_recent_index(&index_path, &entries).unwrap();

        let result = list_recent(&index_path);

        assert_eq!(result.len(), 1);
        assert_eq!(result[0].path, still_there.to_str().unwrap());
    }

    #[test]
    fn list_recent_persists_the_pruned_list_back_to_disk() {
        let dir = ScratchDir::new("recent_persist_prune");
        let index_path = dir.path().join("recent.json");
        let entries = vec![entry("/nonexistent/gone.ppsx", json!({}))];
        write_recent_index(&index_path, &entries).unwrap();

        list_recent(&index_path);

        let persisted = read_raw(&index_path);
        assert!(persisted.is_empty());
    }

    #[test]
    fn list_recent_does_not_rewrite_the_file_when_nothing_is_pruned() {
        let dir = ScratchDir::new("recent_no_rewrite");
        let index_path = dir.path().join("recent.json");
        let still_there = dir.path().join("still-there.ppsx");
        std::fs::write(&still_there, b"content").unwrap();
        let entries = vec![entry(still_there.to_str().unwrap(), json!({}))];
        write_recent_index(&index_path, &entries).unwrap();
        let modified_before = std::fs::metadata(&index_path).unwrap().modified().unwrap();

        std::thread::sleep(std::time::Duration::from_millis(20));
        list_recent(&index_path);

        let modified_after = std::fs::metadata(&index_path).unwrap().modified().unwrap();
        assert_eq!(modified_before, modified_after);
    }

    #[test]
    fn write_then_list_round_trips_arbitrary_extra_fields() {
        let dir = ScratchDir::new("recent_roundtrip_extra");
        let index_path = dir.path().join("recent.json");
        let project_file = dir.path().join("proje-çşğ.ppsx");
        std::fs::write(&project_file, b"content").unwrap();
        let entries = vec![entry(
            project_file.to_str().unwrap(),
            json!({
                "title": "Şişli Hattı Arıza Analizi",
                "owner": "B. Gövem",
                "currentStep": 4,
                "lastModified": "2026-08-02T10:00:00Z",
            }),
        )];
        write_recent_index(&index_path, &entries).unwrap();

        let result = list_recent(&index_path);

        assert_eq!(result.len(), 1);
        assert_eq!(result[0].extra["title"], "Şişli Hattı Arıza Analizi");
        assert_eq!(result[0].extra["owner"], "B. Gövem");
        assert_eq!(result[0].extra["currentStep"], 4);
    }

    #[test]
    fn write_recent_index_leaves_no_tmp_file_behind() {
        let dir = ScratchDir::new("recent_write_atomic");
        let index_path = dir.path().join("recent.json");

        write_recent_index(&index_path, &[entry("/a.ppsx", json!({}))]).unwrap();

        let leftovers: Vec<_> = std::fs::read_dir(dir.path())
            .unwrap()
            .filter_map(|e| e.ok())
            .map(|e| e.file_name().to_string_lossy().into_owned())
            .filter(|name| name.contains(".tmp-"))
            .collect();
        assert!(leftovers.is_empty(), "leftover tmp files: {leftovers:?}");
    }
}
