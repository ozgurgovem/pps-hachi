use std::collections::HashSet;
use std::io::{Read, Write};
use std::path::Path;

use serde_json::Value;

use super::atomic::atomic_write;
use super::error::PpsxError;
use super::manifest::check_routing_ids;

/// Everything in a `.ppsx` that is not `manifest.json` or `project.json`.
/// Rust never interprets these (D-55). Content bytes round-trip intact;
/// the zip *member* itself does not necessarily (directory entries are
/// dropped, and a non-canonical name — backslash-separated, `./`-prefixed —
/// is read once under its normalized form and re-written under that name,
/// not its original spelling. See D-67.
#[derive(Debug, Clone)]
pub struct ArchiveEntry {
    pub name: String,
    pub bytes: Vec<u8>,
}

#[derive(Debug)]
pub struct PpsxContents {
    pub manifest: Value,
    pub project: Value,
    pub other_entries: Vec<ArchiveEntry>,
}

struct Limits {
    max_entries: usize,
    max_entry_bytes: u64,
    max_total_bytes: u64,
}

/// Defensive bounds against a hostile or corrupt zip (a `.ppsx` is, per D-06,
/// "portable, emailable" — it can arrive from outside this machine). Generous
/// for a shop-floor A3 report with images; not an attempt to size the format.
const DEFAULT_LIMITS: Limits = Limits {
    max_entries: 2_000,
    max_entry_bytes: 100 * 1024 * 1024,
    max_total_bytes: 512 * 1024 * 1024,
};

/// D-67: generous per-entry allowance (local header + central directory
/// record + filename) added on top of the real content budget to build a
/// cheap, coarse ceiling on the *raw file size* — see `file_size_ceiling`.
const PER_ENTRY_OVERHEAD_ALLOWANCE_BYTES: u64 = 256;

/// D-93 (post-implementation review, 2026-08-02): `enforce_write_limits`
/// mirrored `read_ppsx`'s entry-count/entry-size/total-size caps (D-78) but
/// had no counterpart to the read side's `file_size_ceiling`, which budgets
/// `PER_ENTRY_OVERHEAD_ALLOWANCE_BYTES` (256) per entry for zip headers
/// *and the entry's name*. An entry name is not otherwise capped, so enough
/// very long names could pass every other write-side check and still
/// produce a file over the read side's ceiling — measured at ~240 MB over
/// budget for 2,000 entries with 60,000-byte names. A zip entry name is
/// stored in both the local file header and the central directory record,
/// so its byte cost against that 256-byte allowance is roughly double its
/// length plus ~76 bytes of fixed header fields — a name over ~90 bytes
/// could already exceed the allowance on its own. This cap sits comfortably
/// under that with headroom to spare.
/// Not reachable by anything the app itself constructs today (no code path
/// mints arbitrarily long entry names), but cheap enough to close outright
/// rather than leave as a documented gap.
const MAX_ENTRY_NAME_BYTES: usize = 80;

pub fn read_ppsx(path: &Path) -> Result<PpsxContents, PpsxError> {
    read_ppsx_with_limits(path, &DEFAULT_LIMITS)
}

/// D-77: the compare-and-swap primitive both `ppsx_read` (to capture what to
/// send back to the caller) and `ppsx_write` (to detect a concurrent writer)
/// key off. Millisecond resolution, matching JS `Date.now()`/`Number` — an
/// `i64`/`u128` nanosecond value would round-trip lossily through the JSON
/// IPC bridge (`serde_json::Number` cannot hold a `u128`).
pub fn file_modified_ms(path: &Path) -> Result<u64, PpsxError> {
    let modified = std::fs::metadata(path)
        .and_then(|meta| meta.modified())
        .map_err(|e| PpsxError::io(path, e))?;
    let millis = modified
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0);
    Ok(millis.min(u64::MAX as u128) as u64)
}

/// D-67: `ZipArchive::new()` parses the entire central directory into memory
/// unconditionally, before `archive.len() > limits.max_entries` below ever
/// runs — so an entry-count cap checked only after opening can't protect the
/// parse that precedes it. This is a coarse pre-filter on the file's own
/// size, independent of (and in addition to) the content-size caps enforced
/// per entry during the read loop.
fn file_size_ceiling(limits: &Limits) -> u64 {
    limits
        .max_total_bytes
        .saturating_add(limits.max_entries as u64 * PER_ENTRY_OVERHEAD_ALLOWANCE_BYTES)
}

/// Reads at most `budget + 1` bytes — the `+1` lets the caller tell "read
/// exactly the budget" apart from "there was more" without ever reading an
/// unbounded amount either way.
///
/// D-67: never trusts a declared/expected size for how much to allocate or
/// how much is safe to read. `entry.size()` (the zip's own declared
/// uncompressed size) is an unverified claim by the archive's author, and
/// the decompressor does not clamp output to it — a crafted entry can
/// declare a few bytes and decompress to hundreds of megabytes. This
/// function is the only thing standing between that and an OOM, so it must
/// never consult `entry.size()` at all, and it doesn't.
fn read_capped<R: Read>(reader: R, budget: u64) -> std::io::Result<Vec<u8>> {
    let mut bytes = Vec::new();
    reader
        .take(budget.saturating_add(1))
        .read_to_end(&mut bytes)?;
    Ok(bytes)
}

fn read_ppsx_with_limits(path: &Path, limits: &Limits) -> Result<PpsxContents, PpsxError> {
    let file_len = std::fs::metadata(path)
        .map_err(|e| PpsxError::io(path, e))?
        .len();
    let ceiling = file_size_ceiling(limits);
    if file_len > ceiling {
        return Err(PpsxError::ArchiveTooLarge {
            actual: file_len,
            limit: ceiling,
        });
    }

    let file = std::fs::File::open(path).map_err(|e| PpsxError::io(path, e))?;
    let mut archive = zip::ZipArchive::new(std::io::BufReader::new(file))?;

    if archive.len() > limits.max_entries {
        return Err(PpsxError::TooManyEntries {
            actual: archive.len(),
            limit: limits.max_entries,
        });
    }

    let mut manifest: Option<Value> = None;
    let mut project: Option<Value> = None;
    let mut other_entries = Vec::new();
    let mut total_bytes: u64 = 0;
    let mut seen_names: HashSet<String> = HashSet::new();

    for index in 0..archive.len() {
        let mut entry = archive.by_index(index)?;

        if entry.is_dir() {
            continue;
        }

        // `enclosed_name()` only returns `None` for traversal that escapes the
        // root (`foo/../../bar`) — by design it *normalizes* a leading root or
        // drive prefix into a relative path instead of rejecting it ("allows
        // extraction of ZIP files with absolute paths, similar to other ZIP
        // tools"). D-55 asks for a hard reject on absolute names too, so that
        // case is checked explicitly against the raw, pre-normalization name.
        if looks_absolute(entry.name()) {
            return Err(PpsxError::UnsafeEntryName(entry.name().to_string()));
        }

        // D-55: `enclosed_name() == None` is a hard reject — it catches NUL
        // bytes and traversal outside the container root.
        let enclosed = entry
            .enclosed_name()
            .ok_or_else(|| PpsxError::UnsafeEntryName(entry.name().to_string()))?;

        if entry.is_symlink() {
            return Err(PpsxError::UnsafeEntryName(entry.name().to_string()));
        }

        let name = to_zip_path_string(&enclosed);

        // D-67: read and write must agree on what a safe name is — run the
        // normalized name through the exact predicate the write side uses,
        // so the two can't drift again. This also catches an entry that
        // normalizes to empty (`foo/..`), which `enclosed_name` allows.
        if !is_safe_relative_name(&name) {
            return Err(PpsxError::UnsafeEntryName(entry.name().to_string()));
        }
        // D-67: two entries that normalize to the same name (`assets/a.png`
        // vs `assets\a.png`, or `x` vs `./x`) would otherwise silently pick
        // whichever the loop visits last — including manifest.json/
        // project.json, which `check_routing_ids` would then validate
        // without ever seeing the other one.
        if !seen_names.insert(name.clone()) {
            return Err(PpsxError::Corrupt(format!(
                "duplicate entry name after normalization: '{name}'"
            )));
        }

        // D-67: the budget is the tighter of "this entry's own cap" and
        // "what's left of the total cap" — read_capped enforces it against
        // actual bytes produced, never against entry.size().
        let remaining_total_budget = limits.max_total_bytes.saturating_sub(total_bytes);
        let budget = limits.max_entry_bytes.min(remaining_total_budget);
        let bytes = read_capped(&mut entry, budget).map_err(|e| PpsxError::io(&enclosed, e))?;
        let actual_len = bytes.len() as u64;

        if actual_len > budget {
            if actual_len > limits.max_entry_bytes {
                return Err(PpsxError::EntryTooLarge {
                    name,
                    actual: actual_len,
                    limit: limits.max_entry_bytes,
                });
            }
            return Err(PpsxError::ArchiveTooLarge {
                actual: total_bytes + actual_len,
                limit: limits.max_total_bytes,
            });
        }
        total_bytes += actual_len;

        match name.as_str() {
            "manifest.json" => {
                manifest = Some(serde_json::from_slice(&bytes).map_err(|_| {
                    PpsxError::Corrupt("manifest.json is not valid JSON".to_string())
                })?);
            }
            "project.json" => {
                project = Some(serde_json::from_slice(&bytes).map_err(|_| {
                    PpsxError::Corrupt("project.json is not valid JSON".to_string())
                })?);
            }
            _ => other_entries.push(ArchiveEntry { name, bytes }),
        }
    }

    let manifest =
        manifest.ok_or_else(|| PpsxError::Corrupt("missing manifest.json".to_string()))?;
    let project = project.ok_or_else(|| PpsxError::Corrupt("missing project.json".to_string()))?;

    check_routing_ids(&manifest, &project)?;

    Ok(PpsxContents {
        manifest,
        project,
        other_entries,
    })
}

/// D-78: mirrors `DEFAULT_LIMITS` on the read side (D-67) — without this,
/// nothing stops the app from producing a `.ppsx` it will then refuse to
/// open, since `read_ppsx` enforces the same caps against the file this
/// function just wrote. Checked against uncompressed content size, same as
/// the read side; compression only ever makes the actual file smaller.
fn enforce_write_limits(
    manifest_bytes: &[u8],
    project_bytes: &[u8],
    other_entries: &[ArchiveEntry],
) -> Result<(), PpsxError> {
    let limits = &DEFAULT_LIMITS;
    let entry_count = 2 + other_entries.len();
    if entry_count > limits.max_entries {
        return Err(PpsxError::TooManyEntries {
            actual: entry_count,
            limit: limits.max_entries,
        });
    }

    let mut total_bytes: u64 = 0;
    for (name, bytes) in [
        ("manifest.json", manifest_bytes),
        ("project.json", project_bytes),
    ]
    .into_iter()
    .chain(
        other_entries
            .iter()
            .map(|e| (e.name.as_str(), e.bytes.as_slice())),
    ) {
        let len = bytes.len() as u64;
        if len > limits.max_entry_bytes {
            return Err(PpsxError::EntryTooLarge {
                name: name.to_string(),
                actual: len,
                limit: limits.max_entry_bytes,
            });
        }
        total_bytes += len;
    }
    if total_bytes > limits.max_total_bytes {
        return Err(PpsxError::ArchiveTooLarge {
            actual: total_bytes,
            limit: limits.max_total_bytes,
        });
    }
    Ok(())
}

/// D-77: `expected_modified_ms` implements an optimistic compare-and-swap —
/// `None` means "write unconditionally" (a brand-new project has no prior
/// read to compare against); `Some(ms)` refuses with `PpsxError::Conflict`
/// if the file's current mtime disagrees. Returns the file's new mtime so
/// the caller can chain the next write's expectation off this one, without
/// a second `stat` round trip.
///
/// P-15 (post-implementation review, 2026-08-02): mtime equality is NOT a
/// content-identity check, and this does **not** deliver "autosave can
/// never blind-overwrite a change made by another instance" — that claim
/// was written here and was false. Empirically confirmed defeated by (a)
/// any writer that preserves mtime on save (sync clients, `rsync -t`,
/// `robocopy /COPY:T`, a backup restore) and (b) coarse mtime granularity —
/// FAT32 is 2s, common SMB shares are 1s, both plausible on the shared
/// plant drives D-06/D-77 name as the actual threat. It is still strictly
/// better than Phase 2's 100%-of-the-time clobber, but is a narrowing of
/// the race, not a close of it. See P-15 for the planned fix (widen the
/// token to `(modified_ms, len)`, or hash the last-read bytes).
pub fn write_ppsx(
    path: &Path,
    manifest: &Value,
    project: &Value,
    other_entries: &[ArchiveEntry],
    expected_modified_ms: Option<u64>,
) -> Result<u64, PpsxError> {
    check_routing_ids(manifest, project)?;

    if let Some(expected) = expected_modified_ms {
        if path.exists() {
            let actual = file_modified_ms(path)?;
            if actual != expected {
                return Err(PpsxError::Conflict { expected, actual });
            }
        }
    }

    let mut seen_names: HashSet<&str> = HashSet::new();
    for entry in other_entries {
        if !is_safe_relative_name(&entry.name) {
            return Err(PpsxError::UnsafeEntryName(entry.name.clone()));
        }
        // D-92: the zip spec requires `/` as the separator, and `read_ppsx`
        // normalizes `\` to `/` before its own duplicate check — so writing
        // both `assets/a.png` and `assets\a.png` passes the exact-string
        // duplicate check below and then produces a file `read_ppsx` refuses
        // as `duplicate entry name after normalization`. Same "write
        // succeeds, read then refuses" shape D-78 exists to close. A single
        // backslash name is no better: it round-trips under a silently
        // different name. Only a writer needs this — the read side feeds
        // `is_safe_relative_name` an already-normalized name, and must keep
        // splitting on both separators (D-67).
        if entry.name.contains('\\') {
            return Err(PpsxError::UnsafeEntryName(entry.name.clone()));
        }
        if entry.name == "manifest.json" || entry.name == "project.json" {
            return Err(PpsxError::UnsafeEntryName(entry.name.clone()));
        }
        // D-93: an unbounded name lets zip-header overhead alone push the
        // written file past the read side's `file_size_ceiling` (D-67).
        if entry.name.len() > MAX_ENTRY_NAME_BYTES {
            return Err(PpsxError::UnsafeEntryName(entry.name.clone()));
        }
        if !seen_names.insert(entry.name.as_str()) {
            return Err(PpsxError::Corrupt(format!(
                "duplicate entry name: '{}'",
                entry.name
            )));
        }
    }

    let manifest_bytes = serde_json::to_vec_pretty(manifest)?;
    let project_bytes = serde_json::to_vec_pretty(project)?;
    enforce_write_limits(&manifest_bytes, &project_bytes, other_entries)?;

    let mut buffer = Vec::new();
    {
        let mut writer = zip::ZipWriter::new(std::io::Cursor::new(&mut buffer));
        let options = zip::write::SimpleFileOptions::default()
            .compression_method(zip::CompressionMethod::Deflated);

        writer.start_file("manifest.json", options)?;
        writer
            .write_all(&manifest_bytes)
            .map_err(|e| PpsxError::io(path, e))?;

        writer.start_file("project.json", options)?;
        writer
            .write_all(&project_bytes)
            .map_err(|e| PpsxError::io(path, e))?;

        for entry in other_entries {
            writer.start_file(entry.name.as_str(), options)?;
            writer
                .write_all(&entry.bytes)
                .map_err(|e| PpsxError::io(path, e))?;
        }

        writer.finish()?;
    }

    atomic_write(path, &buffer)?;
    file_modified_ms(path)
}

/// Catches both Unix-style (`/etc/passwd`) and Windows-style (`C:\...`,
/// `\\server\share`) absolute names in the raw, un-normalized entry name.
fn looks_absolute(raw_name: &str) -> bool {
    if raw_name.starts_with('/') || raw_name.starts_with('\\') {
        return true;
    }
    let bytes = raw_name.as_bytes();
    bytes.len() >= 2 && bytes[0].is_ascii_alphabetic() && bytes[1] == b':'
}

/// Zip entries are always forward-slash internally, regardless of host OS
/// (the format spec requires it). `Path::to_string_lossy` on the `PathBuf`
/// `enclosed_name` returns would use the platform separator on Windows —
/// rejoining components by hand keeps the name we write back consistent.
fn to_zip_path_string(path: &Path) -> String {
    path.components()
        .map(|c| c.as_os_str().to_string_lossy().into_owned())
        .collect::<Vec<_>>()
        .join("/")
}

/// The one definition of "safe name" shared by both directions: the read
/// loop runs every normalized name through this before accepting it, and
/// `write_ppsx` runs every `other_entries` name through it before trusting
/// it enough to write.
///
/// D-67: deliberately platform-independent — splits on both `/` and `\`
/// regardless of host OS, matching `enclosed_name()` (which always treats
/// both as separators via `typed_path::Utf8WindowsPath`, because a zip entry
/// name is not a host path). Using `std::path::Path` here instead would give
/// this the *host's* separator rules, silently passing a Windows-style
/// traversal name like `..\..\evil` through unchecked on macOS/Linux, where
/// `\` is just an ordinary filename character — that was the actual gap.
fn is_safe_relative_name(name: &str) -> bool {
    if name.is_empty() || name.contains('\0') || looks_absolute(name) {
        return false;
    }
    name.split(['/', '\\'])
        .all(|segment| !segment.is_empty() && segment != "." && segment != "..")
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ppsx::test_support::ScratchDir;
    use serde_json::json;
    use std::io::Cursor;

    fn sample_manifest() -> Value {
        json!({ "id": "proj-1", "schemaVersion": 1, "appVersion": "0.1.0" })
    }

    fn sample_project() -> Value {
        json!({ "id": "proj-1", "schemaVersion": 1, "meta": { "title": "Örnek Proje — çşğüö" } })
    }

    /// Builds a raw zip bypassing `write_ppsx`'s own safety checks, so tests
    /// can prove the *read* path rejects a maliciously-crafted `.ppsx` — the
    /// realistic threat, since these files are emailed in from outside (D-06).
    fn raw_zip_with_entry(name: &str, bytes: &[u8]) -> Vec<u8> {
        let mut buffer = Vec::new();
        {
            let mut writer = zip::ZipWriter::new(Cursor::new(&mut buffer));
            let options = zip::write::SimpleFileOptions::default();
            writer.start_file(name, options).unwrap();
            writer.write_all(bytes).unwrap();
            writer.finish().unwrap();
        }
        buffer
    }

    #[test]
    fn round_trips_manifest_and_project_content() {
        let dir = ScratchDir::new("archive_roundtrip");
        let target = dir.path().join("project.ppsx");
        let manifest = sample_manifest();
        let project = sample_project();

        write_ppsx(&target, &manifest, &project, &[], None).unwrap();
        let read_back = read_ppsx(&target).unwrap();

        assert_eq!(read_back.manifest, manifest);
        assert_eq!(read_back.project, project);
        assert!(read_back.other_entries.is_empty());
    }

    #[test]
    fn round_trips_unknown_top_level_entries_untouched() {
        let dir = ScratchDir::new("archive_unknown_entries");
        let target = dir.path().join("project.ppsx");
        let asset = ArchiveEntry {
            name: "assets/img_1.png".to_string(),
            bytes: vec![0xDE, 0xAD, 0xBE, 0xEF],
        };

        write_ppsx(
            &target,
            &sample_manifest(),
            &sample_project(),
            &[asset],
            None,
        )
        .unwrap();
        let read_back = read_ppsx(&target).unwrap();

        assert_eq!(read_back.other_entries.len(), 1);
        assert_eq!(read_back.other_entries[0].name, "assets/img_1.png");
        assert_eq!(
            read_back.other_entries[0].bytes,
            vec![0xDE, 0xAD, 0xBE, 0xEF]
        );
    }

    #[test]
    fn skips_explicit_directory_entries() {
        let dir = ScratchDir::new("archive_dir_entries");
        let target = dir.path().join("project.ppsx");
        let mut buffer = Vec::new();
        {
            let mut writer = zip::ZipWriter::new(Cursor::new(&mut buffer));
            let options = zip::write::SimpleFileOptions::default();
            writer.add_directory("assets/", options).unwrap();
            writer.start_file("manifest.json", options).unwrap();
            writer
                .write_all(
                    serde_json::to_string(&sample_manifest())
                        .unwrap()
                        .as_bytes(),
                )
                .unwrap();
            writer.start_file("project.json", options).unwrap();
            writer
                .write_all(serde_json::to_string(&sample_project()).unwrap().as_bytes())
                .unwrap();
            writer.finish().unwrap();
        }
        std::fs::write(&target, &buffer).unwrap();

        let read_back = read_ppsx(&target).unwrap();
        assert!(read_back.other_entries.is_empty());
    }

    #[test]
    fn rejects_path_traversal_entry() {
        let dir = ScratchDir::new("archive_traversal");
        let target = dir.path().join("evil.ppsx");
        std::fs::write(&target, raw_zip_with_entry("../../evil.txt", b"pwned")).unwrap();

        let err = read_ppsx(&target).unwrap_err();
        assert!(matches!(err, PpsxError::UnsafeEntryName(_)), "{err:?}");
    }

    #[test]
    fn rejects_absolute_path_entry() {
        let dir = ScratchDir::new("archive_absolute");
        let target = dir.path().join("evil.ppsx");
        std::fs::write(&target, raw_zip_with_entry("/etc/passwd", b"pwned")).unwrap();

        let err = read_ppsx(&target).unwrap_err();
        assert!(matches!(err, PpsxError::UnsafeEntryName(_)), "{err:?}");
    }

    #[test]
    fn rejects_symlink_entry() {
        let dir = ScratchDir::new("archive_symlink");
        let target = dir.path().join("evil.ppsx");
        let mut buffer = Vec::new();
        {
            let mut writer = zip::ZipWriter::new(Cursor::new(&mut buffer));
            let options = zip::write::SimpleFileOptions::default();
            writer
                .add_symlink("assets/link", "/etc/passwd", options)
                .unwrap();
            writer.finish().unwrap();
        }
        std::fs::write(&target, &buffer).unwrap();

        let err = read_ppsx(&target).unwrap_err();
        assert!(matches!(err, PpsxError::UnsafeEntryName(_)), "{err:?}");
    }

    #[test]
    fn rejects_missing_manifest() {
        let dir = ScratchDir::new("archive_no_manifest");
        let target = dir.path().join("bad.ppsx");
        std::fs::write(
            &target,
            raw_zip_with_entry(
                "project.json",
                serde_json::to_string(&sample_project()).unwrap().as_bytes(),
            ),
        )
        .unwrap();

        let err = read_ppsx(&target).unwrap_err();
        assert!(matches!(err, PpsxError::Corrupt(_)), "{err:?}");
    }

    #[test]
    fn rejects_missing_project() {
        let dir = ScratchDir::new("archive_no_project");
        let target = dir.path().join("bad.ppsx");
        std::fs::write(
            &target,
            raw_zip_with_entry(
                "manifest.json",
                serde_json::to_string(&sample_manifest())
                    .unwrap()
                    .as_bytes(),
            ),
        )
        .unwrap();

        let err = read_ppsx(&target).unwrap_err();
        assert!(matches!(err, PpsxError::Corrupt(_)), "{err:?}");
    }

    #[test]
    fn rejects_malformed_manifest_json() {
        let dir = ScratchDir::new("archive_bad_json");
        let target = dir.path().join("bad.ppsx");
        let mut buffer = Vec::new();
        {
            let mut writer = zip::ZipWriter::new(Cursor::new(&mut buffer));
            let options = zip::write::SimpleFileOptions::default();
            writer.start_file("manifest.json", options).unwrap();
            writer.write_all(b"{ not json").unwrap();
            writer.start_file("project.json", options).unwrap();
            writer
                .write_all(serde_json::to_string(&sample_project()).unwrap().as_bytes())
                .unwrap();
            writer.finish().unwrap();
        }
        std::fs::write(&target, &buffer).unwrap();

        let err = read_ppsx(&target).unwrap_err();
        assert!(matches!(err, PpsxError::Corrupt(_)), "{err:?}");
    }

    #[test]
    fn rejects_manifest_project_id_mismatch() {
        let dir = ScratchDir::new("archive_id_mismatch");
        let target = dir.path().join("bad.ppsx");
        let mismatched_project = json!({ "id": "different", "schemaVersion": 1 });
        let mut buffer = Vec::new();
        {
            let mut writer = zip::ZipWriter::new(Cursor::new(&mut buffer));
            let options = zip::write::SimpleFileOptions::default();
            writer.start_file("manifest.json", options).unwrap();
            writer
                .write_all(
                    serde_json::to_string(&sample_manifest())
                        .unwrap()
                        .as_bytes(),
                )
                .unwrap();
            writer.start_file("project.json", options).unwrap();
            writer
                .write_all(
                    serde_json::to_string(&mismatched_project)
                        .unwrap()
                        .as_bytes(),
                )
                .unwrap();
            writer.finish().unwrap();
        }
        std::fs::write(&target, &buffer).unwrap();

        let err = read_ppsx(&target).unwrap_err();
        assert!(matches!(err, PpsxError::Corrupt(_)), "{err:?}");
    }

    #[test]
    fn rejects_archive_exceeding_entry_count_cap() {
        let dir = ScratchDir::new("archive_too_many_entries");
        let target = dir.path().join("big.ppsx");
        let mut buffer = Vec::new();
        {
            let mut writer = zip::ZipWriter::new(Cursor::new(&mut buffer));
            let options = zip::write::SimpleFileOptions::default();
            for i in 0..5 {
                writer
                    .start_file(format!("assets/img_{i}.png"), options)
                    .unwrap();
                writer.write_all(b"x").unwrap();
            }
            writer.finish().unwrap();
        }
        std::fs::write(&target, &buffer).unwrap();

        let tiny_limits = Limits {
            max_entries: 2,
            max_entry_bytes: DEFAULT_LIMITS.max_entry_bytes,
            max_total_bytes: DEFAULT_LIMITS.max_total_bytes,
        };
        let err = read_ppsx_with_limits(&target, &tiny_limits).unwrap_err();
        assert!(matches!(err, PpsxError::TooManyEntries { .. }), "{err:?}");
    }

    #[test]
    fn rejects_entry_exceeding_per_entry_size_cap() {
        let dir = ScratchDir::new("archive_entry_too_big");
        let target = dir.path().join("big.ppsx");
        std::fs::write(
            &target,
            raw_zip_with_entry("assets/img_1.png", &vec![0u8; 1024]),
        )
        .unwrap();

        let tiny_limits = Limits {
            max_entries: DEFAULT_LIMITS.max_entries,
            max_entry_bytes: 100,
            max_total_bytes: DEFAULT_LIMITS.max_total_bytes,
        };
        let err = read_ppsx_with_limits(&target, &tiny_limits).unwrap_err();
        assert!(matches!(err, PpsxError::EntryTooLarge { .. }), "{err:?}");
    }

    #[test]
    fn rejects_archive_exceeding_total_size_cap() {
        let dir = ScratchDir::new("archive_total_too_big");
        let target = dir.path().join("big.ppsx");
        let mut buffer = Vec::new();
        {
            let mut writer = zip::ZipWriter::new(Cursor::new(&mut buffer));
            let options = zip::write::SimpleFileOptions::default();
            writer.start_file("a", options).unwrap();
            writer.write_all(&[0u8; 100]).unwrap();
            writer.start_file("b", options).unwrap();
            writer.write_all(&[0u8; 100]).unwrap();
            writer.finish().unwrap();
        }
        std::fs::write(&target, &buffer).unwrap();

        let tiny_limits = Limits {
            max_entries: DEFAULT_LIMITS.max_entries,
            max_entry_bytes: DEFAULT_LIMITS.max_entry_bytes,
            max_total_bytes: 150,
        };
        let err = read_ppsx_with_limits(&target, &tiny_limits).unwrap_err();
        assert!(matches!(err, PpsxError::ArchiveTooLarge { .. }), "{err:?}");
    }

    #[test]
    fn write_ppsx_rejects_unsafe_other_entry_name() {
        let dir = ScratchDir::new("archive_write_unsafe_name");
        let target = dir.path().join("project.ppsx");
        let evil = ArchiveEntry {
            name: "../escape.txt".to_string(),
            bytes: vec![1, 2, 3],
        };

        let err = write_ppsx(
            &target,
            &sample_manifest(),
            &sample_project(),
            &[evil],
            None,
        )
        .unwrap_err();
        assert!(matches!(err, PpsxError::UnsafeEntryName(_)), "{err:?}");
    }

    #[test]
    fn write_ppsx_rejects_manifest_project_mismatch() {
        let dir = ScratchDir::new("archive_write_mismatch");
        let target = dir.path().join("project.ppsx");
        let mismatched_project = json!({ "id": "other", "schemaVersion": 1 });

        let err =
            write_ppsx(&target, &sample_manifest(), &mismatched_project, &[], None).unwrap_err();
        assert!(matches!(err, PpsxError::Corrupt(_)), "{err:?}");
    }

    #[test]
    fn round_trips_turkish_text_in_project_content() {
        let dir = ScratchDir::new("archive_turkish");
        let target = dir.path().join("proje.ppsx");
        let project = json!({
            "id": "proj-1",
            "schemaVersion": 1,
            "meta": { "title": "Kaynak hatası — İğneli Şişli çözümü" }
        });

        write_ppsx(&target, &sample_manifest(), &project, &[], None).unwrap();
        let read_back = read_ppsx(&target).unwrap();

        assert_eq!(
            read_back.project["meta"]["title"],
            "Kaynak hatası — İğneli Şişli çözümü"
        );
    }

    // --- D-67: bounded reads never trust a declared/expected size ---------

    #[test]
    fn read_capped_never_reads_more_than_budget_plus_one_regardless_of_source_size() {
        // std::io::repeat is an infinite source — there is no "declared size"
        // to lie about here, which is the point: read_capped must bound
        // itself by budget alone, never by trusting the source about itself.
        let source = std::io::repeat(0u8);
        let bytes = read_capped(source, 100).unwrap();
        assert_eq!(bytes.len(), 101);
    }

    #[test]
    fn read_capped_returns_exactly_what_a_short_source_produces() {
        let source = Cursor::new(vec![1u8, 2, 3]);
        let bytes = read_capped(source, 100).unwrap();
        assert_eq!(bytes, vec![1, 2, 3]);
    }

    #[test]
    fn rejects_file_whose_raw_size_exceeds_the_pre_parse_ceiling() {
        let dir = ScratchDir::new("archive_file_size_ceiling");
        let target = dir.path().join("big.ppsx");
        // Padding via entry *count*, not content — proves this check is
        // about raw file size, not the per-entry/total content caps (those
        // are exercised by the tests above).
        let mut buffer = Vec::new();
        {
            let mut writer = zip::ZipWriter::new(Cursor::new(&mut buffer));
            let options = zip::write::SimpleFileOptions::default();
            for i in 0..50 {
                writer.start_file(format!("f{i}"), options).unwrap();
                writer.write_all(b"x").unwrap();
            }
            writer.finish().unwrap();
        }
        std::fs::write(&target, &buffer).unwrap();
        let raw_len = buffer.len() as u64;

        let tiny_limits = Limits {
            max_entries: 1,
            max_entry_bytes: DEFAULT_LIMITS.max_entry_bytes,
            max_total_bytes: 1,
        };
        let err = read_ppsx_with_limits(&target, &tiny_limits).unwrap_err();
        match err {
            PpsxError::ArchiveTooLarge { actual, .. } => assert_eq!(actual, raw_len),
            other => panic!("expected ArchiveTooLarge keyed on raw file size, got {other:?}"),
        }
    }

    // --- D-67: read and write must agree on what a safe/valid name is -----

    #[test]
    fn is_safe_relative_name_rejects_backslash_traversal_regardless_of_host_platform() {
        assert!(!is_safe_relative_name("..\\..\\evil"));
        assert!(!is_safe_relative_name("..\\evil"));
        assert!(!is_safe_relative_name("C:\\evil"));
        assert!(!is_safe_relative_name("\\\\server\\share\\evil"));
        assert!(!is_safe_relative_name(""));
        assert!(!is_safe_relative_name("."));
        assert!(!is_safe_relative_name("assets/../../evil"));
        assert!(is_safe_relative_name("assets/img_1.png"));
    }

    #[test]
    fn write_ppsx_rejects_backslash_traversal_name_on_any_host_platform() {
        // The exact PoC the review found: on macOS/Linux, std::path::Path
        // treats a whole backslash-separated string as one Component::Normal,
        // so the old host-platform-based check let this straight through.
        let dir = ScratchDir::new("archive_write_backslash_traversal");
        let target = dir.path().join("project.ppsx");
        let evil = ArchiveEntry {
            name: "..\\..\\..\\Windows\\System32\\evil.dll".to_string(),
            bytes: vec![1, 2, 3],
        };

        let err = write_ppsx(
            &target,
            &sample_manifest(),
            &sample_project(),
            &[evil],
            None,
        )
        .unwrap_err();
        assert!(matches!(err, PpsxError::UnsafeEntryName(_)), "{err:?}");
    }

    /// D-92: `write_ppsx` checked `other_entries` names for exact-string
    /// duplicates while `read_ppsx` checks them *after* normalizing `\` to
    /// `/`, so this pair wrote successfully and then produced a `.ppsx` the
    /// reader permanently refused as a duplicate — the "write succeeds, read
    /// then refuses" failure D-78 exists to close, with different inputs.
    #[test]
    fn write_ppsx_rejects_separator_variant_names_that_read_would_call_duplicates() {
        let dir = ScratchDir::new("archive_write_separator_variants");
        let target = dir.path().join("project.ppsx");
        let entries = vec![
            ArchiveEntry {
                name: "assets/a.png".to_string(),
                bytes: vec![1],
            },
            ArchiveEntry {
                name: "assets\\a.png".to_string(),
                bytes: vec![2],
            },
        ];

        let err = write_ppsx(
            &target,
            &sample_manifest(),
            &sample_project(),
            &entries,
            None,
        )
        .unwrap_err();

        assert!(matches!(err, PpsxError::UnsafeEntryName(_)), "{err:?}");
        assert!(!target.exists(), "a rejected write must not touch the file");
    }

    /// The single-entry half of the same asymmetry: a backslash name is not
    /// a traversal, but it round-trips under a silently different name.
    #[test]
    fn write_ppsx_rejects_a_backslash_separated_name_that_is_not_a_traversal() {
        let dir = ScratchDir::new("archive_write_backslash_plain");
        let target = dir.path().join("project.ppsx");
        let entry = ArchiveEntry {
            name: "assets\\a.png".to_string(),
            bytes: vec![1],
        };

        let err = write_ppsx(
            &target,
            &sample_manifest(),
            &sample_project(),
            &[entry],
            None,
        )
        .unwrap_err();

        assert!(matches!(err, PpsxError::UnsafeEntryName(_)), "{err:?}");
    }

    #[test]
    fn write_ppsx_rejects_other_entry_named_like_a_reserved_top_level_file() {
        let dir = ScratchDir::new("archive_write_reserved_name");
        let target = dir.path().join("project.ppsx");
        let evil = ArchiveEntry {
            name: "manifest.json".to_string(),
            bytes: vec![1],
        };

        let err = write_ppsx(
            &target,
            &sample_manifest(),
            &sample_project(),
            &[evil],
            None,
        )
        .unwrap_err();
        assert!(matches!(err, PpsxError::UnsafeEntryName(_)), "{err:?}");
    }

    #[test]
    fn write_ppsx_rejects_duplicate_other_entry_names() {
        let dir = ScratchDir::new("archive_write_duplicate_name");
        let target = dir.path().join("project.ppsx");
        let entries = [
            ArchiveEntry {
                name: "assets/a.png".to_string(),
                bytes: vec![1],
            },
            ArchiveEntry {
                name: "assets/a.png".to_string(),
                bytes: vec![2],
            },
        ];

        let err = write_ppsx(
            &target,
            &sample_manifest(),
            &sample_project(),
            &entries,
            None,
        )
        .unwrap_err();
        assert!(matches!(err, PpsxError::Corrupt(_)), "{err:?}");
    }

    #[test]
    fn rejects_entry_that_normalizes_to_an_empty_name() {
        let dir = ScratchDir::new("archive_empty_normalized_name");
        let target = dir.path().join("evil.ppsx");
        std::fs::write(&target, raw_zip_with_entry("foo/..", b"data")).unwrap();

        let err = read_ppsx(&target).unwrap_err();
        assert!(matches!(err, PpsxError::UnsafeEntryName(_)), "{err:?}");
    }

    #[test]
    fn rejects_entries_that_normalize_to_the_same_name() {
        let dir = ScratchDir::new("archive_duplicate_normalized_name");
        let target = dir.path().join("evil.ppsx");
        let mut buffer = Vec::new();
        {
            let mut writer = zip::ZipWriter::new(Cursor::new(&mut buffer));
            let options = zip::write::SimpleFileOptions::default();
            writer.start_file("assets/a.png", options).unwrap();
            writer.write_all(b"first").unwrap();
            writer.start_file("assets\\a.png", options).unwrap();
            writer.write_all(b"second").unwrap();
            writer.finish().unwrap();
        }
        std::fs::write(&target, &buffer).unwrap();

        let err = read_ppsx(&target).unwrap_err();
        assert!(matches!(err, PpsxError::Corrupt(_)), "{err:?}");
    }

    #[test]
    fn rejects_duplicate_manifest_entries_instead_of_silently_picking_the_last_one() {
        let dir = ScratchDir::new("archive_duplicate_manifest");
        let target = dir.path().join("evil.ppsx");
        let mut buffer = Vec::new();
        {
            let mut writer = zip::ZipWriter::new(Cursor::new(&mut buffer));
            let options = zip::write::SimpleFileOptions::default();
            writer.start_file("manifest.json", options).unwrap();
            writer
                .write_all(
                    serde_json::to_string(&sample_manifest())
                        .unwrap()
                        .as_bytes(),
                )
                .unwrap();
            writer.start_file("./manifest.json", options).unwrap();
            writer
                .write_all(br#"{"id":"different","schemaVersion":1,"appVersion":"9.9.9"}"#)
                .unwrap();
            writer.start_file("project.json", options).unwrap();
            writer
                .write_all(serde_json::to_string(&sample_project()).unwrap().as_bytes())
                .unwrap();
            writer.finish().unwrap();
        }
        std::fs::write(&target, &buffer).unwrap();

        let err = read_ppsx(&target).unwrap_err();
        assert!(matches!(err, PpsxError::Corrupt(_)), "{err:?}");
    }

    // --- D-77: optimistic concurrency (compare-and-swap on mtime) ---------

    #[test]
    fn write_ppsx_succeeds_with_no_expected_mtime_even_when_file_exists() {
        let dir = ScratchDir::new("archive_write_no_expected_mtime");
        let target = dir.path().join("project.ppsx");
        write_ppsx(&target, &sample_manifest(), &sample_project(), &[], None).unwrap();

        let result = write_ppsx(&target, &sample_manifest(), &sample_project(), &[], None);

        assert!(result.is_ok());
    }

    #[test]
    fn write_ppsx_succeeds_when_expected_mtime_matches() {
        let dir = ScratchDir::new("archive_write_matching_mtime");
        let target = dir.path().join("project.ppsx");
        let first_mtime =
            write_ppsx(&target, &sample_manifest(), &sample_project(), &[], None).unwrap();

        let result = write_ppsx(
            &target,
            &sample_manifest(),
            &sample_project(),
            &[],
            Some(first_mtime),
        );

        assert!(result.is_ok());
    }

    #[test]
    fn write_ppsx_rejects_when_file_changed_since_expected_mtime() {
        let dir = ScratchDir::new("archive_write_conflict");
        let target = dir.path().join("project.ppsx");
        write_ppsx(&target, &sample_manifest(), &sample_project(), &[], None).unwrap();
        let stale_mtime = 1; // definitely not the real mtime

        let err = write_ppsx(
            &target,
            &sample_manifest(),
            &sample_project(),
            &[],
            Some(stale_mtime),
        )
        .unwrap_err();

        assert!(matches!(err, PpsxError::Conflict { .. }), "{err:?}");
    }

    #[test]
    fn write_ppsx_ignores_expected_mtime_for_a_brand_new_file() {
        let dir = ScratchDir::new("archive_write_new_file_expected_mtime");
        let target = dir.path().join("project.ppsx");

        // The file doesn't exist yet — an `expected` value here can't mean
        // "was overwritten by someone else", so it must not be treated as one.
        let result = write_ppsx(
            &target,
            &sample_manifest(),
            &sample_project(),
            &[],
            Some(999_999),
        );

        assert!(result.is_ok());
    }

    // --- D-78: write-side caps mirror the read-side ones (D-67) -----------

    #[test]
    fn write_ppsx_rejects_other_entry_exceeding_the_per_entry_size_cap() {
        let dir = ScratchDir::new("archive_write_entry_too_large");
        let target = dir.path().join("project.ppsx");
        let huge = ArchiveEntry {
            name: "assets/huge.bin".to_string(),
            bytes: vec![0u8; (DEFAULT_LIMITS.max_entry_bytes + 1) as usize],
        };

        let err = write_ppsx(
            &target,
            &sample_manifest(),
            &sample_project(),
            &[huge],
            None,
        )
        .unwrap_err();

        assert!(matches!(err, PpsxError::EntryTooLarge { .. }), "{err:?}");
        assert!(
            !target.exists(),
            "must not produce a partially-written file"
        );
    }

    #[test]
    fn write_ppsx_rejects_when_total_uncompressed_size_exceeds_the_cap() {
        let dir = ScratchDir::new("archive_write_total_too_large");
        let target = dir.path().join("project.ppsx");
        // Each entry sits exactly at the per-entry cap (never tripping
        // EntryTooLarge on its own); enough of them together exceed the
        // total cap, which is the thing this test actually exercises.
        let chunk_size = DEFAULT_LIMITS.max_entry_bytes as usize;
        let entry_count = (DEFAULT_LIMITS.max_total_bytes / DEFAULT_LIMITS.max_entry_bytes) + 1;
        let entries: Vec<ArchiveEntry> = (0..entry_count)
            .map(|i| ArchiveEntry {
                name: format!("assets/{i}.bin"),
                bytes: vec![0u8; chunk_size],
            })
            .collect();

        let err = write_ppsx(
            &target,
            &sample_manifest(),
            &sample_project(),
            &entries,
            None,
        )
        .unwrap_err();

        assert!(matches!(err, PpsxError::ArchiveTooLarge { .. }), "{err:?}");
    }

    #[test]
    fn write_ppsx_rejects_when_entry_count_exceeds_the_cap() {
        let dir = ScratchDir::new("archive_write_too_many_entries");
        let target = dir.path().join("project.ppsx");
        let entries: Vec<ArchiveEntry> = (0..DEFAULT_LIMITS.max_entries)
            .map(|i| ArchiveEntry {
                name: format!("assets/img_{i}.png"),
                bytes: vec![0u8; 1],
            })
            .collect();

        let err = write_ppsx(
            &target,
            &sample_manifest(),
            &sample_project(),
            &entries,
            None,
        )
        .unwrap_err();

        assert!(matches!(err, PpsxError::TooManyEntries { .. }), "{err:?}");
    }

    // --- D-93: an unbounded entry name lets header overhead alone blow the
    // read side's file-size ceiling (D-67) ---------------------------------

    #[test]
    fn write_ppsx_rejects_an_entry_name_over_the_length_cap() {
        let dir = ScratchDir::new("archive_write_name_too_long");
        let target = dir.path().join("project.ppsx");
        let evil = ArchiveEntry {
            name: "a".repeat(MAX_ENTRY_NAME_BYTES + 1),
            bytes: vec![1],
        };

        let err = write_ppsx(
            &target,
            &sample_manifest(),
            &sample_project(),
            &[evil],
            None,
        )
        .unwrap_err();

        assert!(matches!(err, PpsxError::UnsafeEntryName(_)), "{err:?}");
    }

    #[test]
    fn write_ppsx_accepts_an_entry_name_at_exactly_the_length_cap() {
        let dir = ScratchDir::new("archive_write_name_at_cap");
        let target = dir.path().join("project.ppsx");
        let entry = ArchiveEntry {
            name: "a".repeat(MAX_ENTRY_NAME_BYTES),
            bytes: vec![1],
        };

        let result = write_ppsx(
            &target,
            &sample_manifest(),
            &sample_project(),
            &[entry],
            None,
        );

        assert!(result.is_ok(), "{result:?}");
    }
}
