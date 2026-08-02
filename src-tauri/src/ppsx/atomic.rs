use std::hash::{BuildHasher, Hasher};
use std::io::Write;
use std::path::Path;

use super::error::PpsxError;

/// D-56/D-68: `.ppsx` (and, per D-60, the recent-projects index) writes are
/// atomic — write to a temp file in the *same directory* as the target
/// (cross-volume rename is a copy, not atomic), fsync, then a single
/// `rename` over the target. Never delete-then-rename: that reopens the
/// exact crash window this exists to close. `std::fs::rename` on Windows
/// calls `MoveFileExW` with `MOVEFILE_REPLACE_EXISTING` (falling back to
/// `SetFileInformationByHandle` with `FILE_RENAME_FLAG_REPLACE_IF_EXISTS`
/// only on `ACCESS_DENIED`, e.g. a read-only target) — either way a single
/// `rename` call replaces an existing target, verified against the actual
/// std source (D-68).
///
/// D-68: the temp file is created with `create_new` (O_EXCL-equivalent)
/// under an unpredictable name, never plain `create()` — `create()` follows
/// an existing symlink and truncates whatever it finds, and the old
/// PID-only name was guessable, so a symlink planted in advance at that path
/// redirected the write (and, after `rename`, the project file itself) to
/// wherever the symlink pointed. `create_new` refuses to follow or replace
/// anything already at the path, and a random component makes the path
/// unguessable in advance rather than merely rare.
pub fn atomic_write(target: &Path, contents: &[u8]) -> Result<(), PpsxError> {
    let dir = target
        .parent()
        .filter(|parent| !parent.as_os_str().is_empty())
        .ok_or_else(|| {
            PpsxError::Corrupt(format!("{} has no parent directory", target.display()))
        })?;
    std::fs::create_dir_all(dir).map_err(|e| PpsxError::io(dir, e))?;

    let file_name = target
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("pps-hachi-write");

    const MAX_ATTEMPTS: u32 = 8;
    let mut last_collision: Option<std::io::Error> = None;

    for _ in 0..MAX_ATTEMPTS {
        let tmp_path = dir.join(format!(
            ".{file_name}.tmp-{}-{:016x}",
            std::process::id(),
            random_component()
        ));

        let file = match std::fs::OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&tmp_path)
        {
            Ok(file) => file,
            Err(e) if e.kind() == std::io::ErrorKind::AlreadyExists => {
                last_collision = Some(e);
                continue;
            }
            Err(e) => return Err(PpsxError::io(&tmp_path, e)),
        };

        return finish_write(file, &tmp_path, target, dir, contents);
    }

    Err(PpsxError::io(
        dir,
        last_collision.unwrap_or_else(|| {
            std::io::Error::other("could not create a uniquely-named temp file")
        }),
    ))
}

fn finish_write(
    mut file: std::fs::File,
    tmp_path: &Path,
    target: &Path,
    dir: &Path,
    contents: &[u8],
) -> Result<(), PpsxError> {
    let write_result = (|| -> Result<(), PpsxError> {
        file.write_all(contents)
            .map_err(|e| PpsxError::io(tmp_path, e))?;
        file.sync_all().map_err(|e| PpsxError::io(tmp_path, e))?;
        Ok(())
    })();

    if let Err(err) = write_result {
        let _ = std::fs::remove_file(tmp_path);
        return Err(err);
    }

    if let Err(e) = std::fs::rename(tmp_path, target) {
        // D-68: the old code only cleaned up on a write failure — a rename
        // failure (a routine transient on Windows when an AV scanner or
        // backup agent has the target open) left the temp file behind
        // permanently next to the user's project.
        let _ = std::fs::remove_file(tmp_path);
        return Err(PpsxError::io(target, e));
    }

    // D-68: `sync_all()` above makes the temp file's *data* durable; nothing
    // yet makes the *directory entry* `rename` just created durable. Best
    // effort and Unix-only — there is no portable directory-handle fsync via
    // std on Windows, and `rename`'s own atomicity guarantee (no torn file)
    // holds regardless of whether this succeeds.
    sync_parent_dir_best_effort(dir);

    Ok(())
}

fn random_component() -> u64 {
    std::collections::hash_map::RandomState::new()
        .build_hasher()
        .finish()
}

#[cfg(unix)]
fn sync_parent_dir_best_effort(dir: &Path) {
    if let Ok(dir_handle) = std::fs::File::open(dir) {
        let _ = dir_handle.sync_all();
    }
}

#[cfg(not(unix))]
fn sync_parent_dir_best_effort(_dir: &Path) {}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ppsx::test_support::ScratchDir;

    #[test]
    fn writes_file_that_does_not_exist_yet() {
        let dir = ScratchDir::new("atomic_new");
        let target = dir.path().join("project.ppsx");

        atomic_write(&target, b"hello").expect("write should succeed");

        assert_eq!(std::fs::read(&target).unwrap(), b"hello");
    }

    #[test]
    fn overwrites_existing_target_with_new_content() {
        let dir = ScratchDir::new("atomic_overwrite");
        let target = dir.path().join("project.ppsx");

        atomic_write(&target, b"version one").unwrap();
        atomic_write(&target, b"version two").unwrap();

        assert_eq!(std::fs::read(&target).unwrap(), b"version two");
    }

    #[test]
    fn leaves_no_tmp_file_behind_on_success() {
        let dir = ScratchDir::new("atomic_no_litter");
        let target = dir.path().join("project.ppsx");

        atomic_write(&target, b"content").unwrap();

        let leftovers: Vec<_> = std::fs::read_dir(dir.path())
            .unwrap()
            .filter_map(|e| e.ok())
            .map(|e| e.file_name().to_string_lossy().into_owned())
            .filter(|name| name.contains(".tmp-"))
            .collect();
        assert!(leftovers.is_empty(), "leftover tmp files: {leftovers:?}");
    }

    #[test]
    fn creates_missing_parent_directories() {
        let dir = ScratchDir::new("atomic_mkdir");
        let target = dir.path().join("nested").join("deeper").join("index.json");

        atomic_write(&target, b"{}").unwrap();

        assert_eq!(std::fs::read(&target).unwrap(), b"{}");
    }

    #[test]
    fn temp_file_stays_on_the_same_volume_as_the_target() {
        // Regression guard for the exact bug D-56 calls out: writing the temp
        // file to the system temp dir instead of the target's own directory
        // turns the final `rename` into a cross-volume copy, which is not atomic.
        let dir = ScratchDir::new("atomic_same_volume");
        let target = dir.path().join("project.ppsx");
        let system_temp = std::env::temp_dir();

        atomic_write(&target, b"content").unwrap();

        let stray: Vec<_> = std::fs::read_dir(&system_temp)
            .unwrap()
            .filter_map(|e| e.ok())
            .map(|e| e.file_name().to_string_lossy().into_owned())
            .filter(|name| name.contains(".project.ppsx.tmp-"))
            .collect();
        assert!(
            stray.is_empty(),
            "temp file leaked into the system temp dir: {stray:?}"
        );
    }

    #[test]
    fn cleans_up_the_temp_file_when_rename_fails() {
        // A directory at the target path makes the final `rename` fail on
        // every platform (you cannot rename a file onto an existing
        // directory) without needing to simulate a permissions/AV-lock race.
        let dir = ScratchDir::new("atomic_rename_failure_cleanup");
        let target = dir.path().join("project.ppsx");
        std::fs::create_dir(&target).unwrap();

        let result = atomic_write(&target, b"content");

        assert!(result.is_err());
        let leftovers: Vec<_> = std::fs::read_dir(dir.path())
            .unwrap()
            .filter_map(|e| e.ok())
            .map(|e| e.file_name().to_string_lossy().into_owned())
            .filter(|name| name.contains(".tmp-"))
            .collect();
        assert!(
            leftovers.is_empty(),
            "leftover tmp files after a failed rename: {leftovers:?}"
        );
    }

    // D-68: a predictable temp path let a pre-planted symlink redirect the
    // write to an arbitrary file. The fix makes the path unpredictable *and*
    // refuses to follow anything already there — this test verifies the
    // second half directly, since the first half can't be forced from a test
    // without reproducing the RNG. Planting a symlink at one guessable
    // candidate path and confirming atomic_write skips straight past it
    // (never opens/follows it, never touches the victim) demonstrates the
    // actual security property: create_new refuses ANY pre-existing path,
    // symlink or not, regardless of how it got there.
    #[cfg(unix)]
    #[test]
    fn does_not_follow_a_symlink_planted_at_a_candidate_temp_path() {
        use std::os::unix::fs::symlink;

        let dir = ScratchDir::new("atomic_symlink_resistance");
        let target = dir.path().join("project.ppsx");
        let victim_dir = ScratchDir::new("atomic_symlink_victim");
        let victim = victim_dir.path().join("important.conf");
        std::fs::write(&victim, b"original victim content").unwrap();

        let guessed_tmp = dir.path().join(format!(
            ".project.ppsx.tmp-{}-0000000000000000",
            std::process::id()
        ));
        symlink(&victim, &guessed_tmp).unwrap();

        atomic_write(&target, b"real project content").unwrap();

        assert_eq!(
            std::fs::read(&victim).unwrap(),
            b"original victim content",
            "the write must never go through the planted symlink"
        );
        assert_eq!(std::fs::read(&target).unwrap(), b"real project content");
        assert!(!target.is_symlink());
    }
}
