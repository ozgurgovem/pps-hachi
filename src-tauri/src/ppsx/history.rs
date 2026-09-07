use serde_json::Value;
use std::path::{Path, PathBuf};

use super::atomic::atomic_write;
use super::error::PpsxError;
use crate::path_safety::is_safe_path_component;

/// D-74/D-75: rolling autosave snapshots, kept as a sidecar under
/// app-local-data-dir (never inside the `.ppsx` itself — see D-74's reasoning:
/// a `.ppsx` is emailed to customers and auditors (D-06), and twenty
/// intermediate drafts of a root-cause statement is not something anyone
/// asked to send along). One JSON file per snapshot, keyed by project id so
/// two open projects never collide.
const HISTORY_DIR_NAME: &str = "history";
const SNAPSHOT_EXTENSION: &str = ".json";

/// D-91/D-92: `project_id` (`manifest.id`, untrusted — read straight out of a
/// `.ppsx` that can arrive by email, D-06) and `timestamp` both become one
/// path component this module builds; `is_safe_path_component` (Faz 10/K4:
/// moved to `crate::path_safety` on its second real use, `ai::usage`'s log
/// sidecar) is the shared, hardened allowlist check. See that module's own
/// doc comment for the full history-of-fixes record.
fn history_dir(app_local_data_dir: &Path, project_id: &str) -> Result<PathBuf, PpsxError> {
    if !is_safe_path_component(project_id) {
        return Err(PpsxError::UnsafeEntryName(project_id.to_string()));
    }
    Ok(app_local_data_dir.join(HISTORY_DIR_NAME).join(project_id))
}

fn snapshot_path(dir: &Path, timestamp: &str) -> Result<PathBuf, PpsxError> {
    if !is_safe_path_component(timestamp) {
        return Err(PpsxError::UnsafeEntryName(timestamp.to_string()));
    }
    Ok(dir.join(format!("{timestamp}{SNAPSHOT_EXTENSION}")))
}

/// Resolves the on-disk directory for a project's snapshots, validating
/// `project_id` — the one entry point every command in `commands.rs` goes
/// through, so the check can't be bypassed by calling a lower-level function
/// directly.
pub fn resolve_history_dir(
    app_local_data_dir: &Path,
    project_id: &str,
) -> Result<PathBuf, PpsxError> {
    history_dir(app_local_data_dir, project_id)
}

/// Writes a new snapshot, then trims to the `keep_last` most recent (D-75's
/// "rolling, last 20" — the count is the caller's decision, not hardcoded
/// here). Lexicographic filename order is chronological order as long as the
/// caller's timestamps are a consistent zero-padded UTC format, which is the
/// same invariant `read_ppsx`'s `history/{iso}.json` sketch already assumed.
pub fn write_snapshot(
    dir: &Path,
    timestamp: &str,
    project: &Value,
    keep_last: usize,
) -> Result<(), PpsxError> {
    let path = snapshot_path(dir, timestamp)?;
    let bytes = serde_json::to_vec_pretty(project)?;
    atomic_write(&path, &bytes)?;
    prune(dir, keep_last)
}

fn prune(dir: &Path, keep_last: usize) -> Result<(), PpsxError> {
    let mut names = list_snapshots(dir);
    // `list_snapshots` returns newest-first; anything past `keep_last` is the
    // oldest overflow and gets removed. A missing file (already pruned by a
    // concurrent call) is not an error — the end state is what matters.
    for stale in names.split_off(keep_last.min(names.len())) {
        if let Ok(path) = snapshot_path(dir, &stale) {
            let _ = std::fs::remove_file(path);
        }
    }
    Ok(())
}

/// Newest-first list of snapshot timestamps. A missing `history/` directory
/// (no autosave has happened yet) is an empty list, not an error — same
/// "degrade gracefully" posture D-60 already established for the recent-
/// projects index, since this is a cache too, never a source of truth.
pub fn list_snapshots(dir: &Path) -> Vec<String> {
    let Ok(read_dir) = std::fs::read_dir(dir) else {
        return Vec::new();
    };
    let mut names: Vec<String> = read_dir
        .filter_map(|entry| entry.ok())
        .filter_map(|entry| entry.file_name().into_string().ok())
        .filter_map(|name| name.strip_suffix(SNAPSHOT_EXTENSION).map(str::to_string))
        // D-92: never advertise a name `read_snapshot` would then refuse.
        // Anything else in this directory (`..json` strips to `..`, `.json`
        // strips to the empty string) is not a snapshot this module wrote,
        // and `prune` must not try to reconstruct a path from it either.
        .filter(|name| is_safe_path_component(name))
        .collect();
    names.sort_unstable_by(|a, b| b.cmp(a));
    names
}

pub fn read_snapshot(dir: &Path, timestamp: &str) -> Result<Value, PpsxError> {
    let path = snapshot_path(dir, timestamp)?;
    let bytes = std::fs::read(&path).map_err(|e| PpsxError::io(&path, e))?;
    serde_json::from_slice(&bytes).map_err(PpsxError::from)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ppsx::test_support::ScratchDir;
    use serde_json::json;

    #[test]
    fn list_snapshots_is_empty_when_directory_does_not_exist() {
        let dir = ScratchDir::new("history_missing_dir");
        assert!(list_snapshots(&dir.path().join("history").join("proj-1")).is_empty());
    }

    #[test]
    fn write_then_read_round_trips_the_project_json() {
        let dir = ScratchDir::new("history_roundtrip");
        let project =
            json!({ "id": "proj-1", "schemaVersion": 1, "meta": { "title": "Örnek — çşğ" } });

        write_snapshot(dir.path(), "2026-08-02T090000Z", &project, 20).unwrap();
        let read_back = read_snapshot(dir.path(), "2026-08-02T090000Z").unwrap();

        assert_eq!(read_back, project);
    }

    #[test]
    fn list_snapshots_returns_newest_first() {
        let dir = ScratchDir::new("history_order");
        let project = json!({ "id": "proj-1" });
        write_snapshot(dir.path(), "2026-08-02T090000Z", &project, 20).unwrap();
        write_snapshot(dir.path(), "2026-08-02T100000Z", &project, 20).unwrap();
        write_snapshot(dir.path(), "2026-08-02T080000Z", &project, 20).unwrap();

        let names = list_snapshots(dir.path());

        assert_eq!(
            names,
            vec![
                "2026-08-02T100000Z",
                "2026-08-02T090000Z",
                "2026-08-02T080000Z"
            ]
        );
    }

    #[test]
    fn write_snapshot_prunes_beyond_keep_last() {
        let dir = ScratchDir::new("history_prune");
        let project = json!({ "id": "proj-1" });
        for hour in 0..5 {
            write_snapshot(
                dir.path(),
                &format!("2026-08-02T{hour:02}0000Z"),
                &project,
                3,
            )
            .unwrap();
        }

        let names = list_snapshots(dir.path());

        assert_eq!(names.len(), 3);
        assert_eq!(
            names,
            vec![
                "2026-08-02T040000Z",
                "2026-08-02T030000Z",
                "2026-08-02T020000Z"
            ]
        );
    }

    #[test]
    fn read_snapshot_rejects_a_timestamp_that_looks_like_path_traversal() {
        let dir = ScratchDir::new("history_traversal");
        let err = read_snapshot(dir.path(), "../../etc/passwd").unwrap_err();
        assert!(matches!(err, PpsxError::UnsafeEntryName(_)), "{err:?}");
    }

    #[test]
    fn read_snapshot_errors_on_missing_file() {
        let dir = ScratchDir::new("history_missing_snapshot");
        assert!(read_snapshot(dir.path(), "2026-08-02T090000Z").is_err());
    }

    // --- D-91: project_id is untrusted (it's manifest.id from a received
    // .ppsx) and must never be trusted as a raw path component -----------

    #[test]
    fn resolve_history_dir_rejects_a_project_id_that_looks_like_path_traversal() {
        let dir = ScratchDir::new("history_dir_traversal");
        let err = resolve_history_dir(dir.path(), "../../../etc").unwrap_err();
        assert!(matches!(err, PpsxError::UnsafeEntryName(_)), "{err:?}");
    }

    #[test]
    fn resolve_history_dir_rejects_an_absolute_project_id() {
        let dir = ScratchDir::new("history_dir_absolute");
        // The exact failure mode this guards against: PathBuf::join silently
        // discards the base entirely when the joined component is absolute.
        let err = resolve_history_dir(dir.path(), "/etc/cron.d/evil").unwrap_err();
        assert!(matches!(err, PpsxError::UnsafeEntryName(_)), "{err:?}");
    }

    #[test]
    fn resolve_history_dir_rejects_a_windows_style_absolute_project_id() {
        let dir = ScratchDir::new("history_dir_windows_absolute");
        let err = resolve_history_dir(dir.path(), "C:\\evil").unwrap_err();
        assert!(matches!(err, PpsxError::UnsafeEntryName(_)), "{err:?}");
    }

    // --- D-92: the D-91 blocklist became an allowlist ---------------------

    /// The empirical form of the D-91/D-92 guarantee: run the exact sequence
    /// `history_save` runs (resolve the dir from an untrusted `manifest.id`,
    /// then write a snapshot) for a corpus of hostile ids, and assert that
    /// anything the check accepted actually landed under the sandbox root —
    /// verified by `canonicalize`, not by reading the code.
    #[test]
    fn no_hostile_project_id_writes_outside_the_app_local_data_dir() {
        let sandbox = ScratchDir::new("history_escape_corpus");
        let base = sandbox.path().join("app_local_data");
        std::fs::create_dir_all(&base).unwrap();
        let outside = sandbox.path().join("OUTSIDE");
        std::fs::create_dir_all(&outside).unwrap();
        let victim = outside.join("victim.json");
        std::fs::write(&victim, b"ORIGINAL").unwrap();

        let hostile = [
            // classic traversal / absolute (D-91)
            "../../../../Library/LaunchAgents/evil",
            "/etc/cron.d/evil",
            "C:\\evil",
            "\\\\server\\share",
            "..",
            ".",
            "../OUTSIDE",
            "..\\..\\OUTSIDE",
            "history/../../OUTSIDE",
            "\0",
            "a\0/../../OUTSIDE",
            "..%2fOUTSIDE",
            "x:stream",
            "~",
            "$HOME",
            // Unicode separator homoglyphs / invisible characters
            "\u{FF0F}..\u{FF0F}OUTSIDE",
            "\u{2044}..\u{2044}OUTSIDE",
            "\u{29F8}..\u{29F8}OUTSIDE",
            "\u{202E}..",
            "\u{0301}..",
            ".\u{200B}.",
            "..\u{00A0}",
            // host-OS-dependent path semantics (Windows trims these)
            ".. ",
            "...",
            "..  ",
            "foo.",
            "foo ",
            // Windows reserved device names
            "CON",
            "NUL",
            "COM1",
            "AUX",
            "PRN",
            "LPT1",
            "con.json",
            "nUl",
        ];

        let project = json!({ "id": "poc" });
        let root = std::fs::canonicalize(&base).unwrap();
        for id in hostile {
            let Ok(dir) = resolve_history_dir(&base, id) else {
                continue;
            };
            if write_snapshot(&dir, "2026-08-02T090000Z", &project, 20).is_err() {
                continue;
            }
            let landed =
                std::fs::canonicalize(dir.join(format!("2026-08-02T090000Z{SNAPSHOT_EXTENSION}")))
                    .unwrap();
            assert!(
                landed.starts_with(&root),
                "escape: id={id:?} wrote to {}",
                landed.display()
            );
        }

        assert_eq!(std::fs::read(&victim).unwrap(), b"ORIGINAL");
    }

    // `is_safe_path_component`'ın kendi doğrulama matrisi artık
    // `crate::path_safety`'nin kendi test modülünde yaşıyor (Faz 10/K4) —
    // burada yalnızca bu modülün onu gerçekten kullandığını doğrulayan
    // entegrasyon testleri kalıyor.

    /// `prune` reconstructs paths from `list_snapshots`' output. Plant files
    /// (and a symlink) in the snapshot directory whose names strip to
    /// path-ish components and confirm nothing outside the directory dies.
    #[test]
    fn prune_cannot_delete_anything_outside_the_snapshot_dir() {
        let sandbox = ScratchDir::new("history_prune_escape");
        let dir = sandbox.path().join("history").join("p1");
        std::fs::create_dir_all(&dir).unwrap();
        let outside = sandbox.path().join("OUTSIDE");
        std::fs::create_dir_all(&outside).unwrap();
        let victim = outside.join("important.json");
        std::fs::write(&victim, b"ORIGINAL").unwrap();

        for hostile in [".json", "..json", "...json", "CON.json", "not-a-snapshot"] {
            let _ = std::fs::write(dir.join(hostile), b"x");
        }
        #[cfg(unix)]
        std::os::unix::fs::symlink(&victim, dir.join("zzz-link.json")).unwrap();

        // keep_last = 0 forces prune to try to delete every name it listed.
        write_snapshot(&dir, "2026-08-02T090000Z", &json!({ "id": "p1" }), 0).unwrap();

        assert_eq!(std::fs::read(&victim).unwrap(), b"ORIGINAL");
        assert!(victim.exists(), "prune followed a symlink out of the dir");
    }

    /// D-92: a name that `read_snapshot` would refuse must never be offered
    /// to the frontend as a restorable snapshot in the first place.
    #[test]
    fn list_snapshots_never_returns_a_name_read_snapshot_would_reject() {
        let dir = ScratchDir::new("history_list_filtering");
        std::fs::create_dir_all(dir.path()).unwrap();
        for hostile in [".json", "..json", "...json", "CON.json"] {
            let _ = std::fs::write(dir.path().join(hostile), b"{}");
        }
        write_snapshot(dir.path(), "2026-08-02T090000Z", &json!({}), 20).unwrap();

        let names = list_snapshots(dir.path());

        assert_eq!(names, vec!["2026-08-02T090000Z"]);
        for name in &names {
            assert!(read_snapshot(dir.path(), name).is_ok(), "{name:?}");
        }
    }

    #[test]
    fn resolve_history_dir_accepts_a_normal_uuid_project_id() {
        let dir = ScratchDir::new("history_dir_normal");
        let resolved =
            resolve_history_dir(dir.path(), "b3f1c2a0-1234-4a3b-9c9d-0123456789ab").unwrap();
        assert_eq!(
            resolved,
            dir.path()
                .join("history")
                .join("b3f1c2a0-1234-4a3b-9c9d-0123456789ab")
        );
    }
}
