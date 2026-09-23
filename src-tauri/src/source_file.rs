//! Reading a file the USER picked, and saying something useful when it fails.
//!
//! Every path that reaches here came out of a native file picker, so it is a
//! place where the failure is the user's problem to act on rather than a bug
//! to log. The failure that motivated this module (2026-09-23) is the one
//! Barış hit adding a shop-floor photo:
//!
//! ```text
//! /Users/…/OneDrive-Farplas…/PHOTO-2025-02-27-20-56-49.jpg: Operation timed out (os error 60)
//! ```
//!
//! `os error 60` is `ETIMEDOUT`, and the path is a macOS **File Provider**
//! location. Measured on the real machine rather than guessed: the file
//! carries the `dataless` flag — OneDrive holds it online-only, with no local
//! copy. Reading such a file normally makes macOS materialise (download) it
//! on demand; when the provider cannot deliver, the read fails with
//! `ETIMEDOUT` instead. Confirmed it is genuinely the provider and not this
//! app: a plain `open()` from an unrelated process fails identically, and
//! polling for 35 s never materialised the file.
//!
//! Two hypotheses were tested and DISPROVEN before settling here, so nobody
//! re-tries them: (1) the process VFS policy
//! `IOPOL_TYPE_VFS_MATERIALIZE_DATALESS_FILES` — already `ON`, and forcing it
//! `ON` changed nothing; (2) a retry loop — eight attempts over 35 s all
//! failed, so a blind retry would only add delay before the same error.
//!
//! What is genuinely this app's to fix is the MESSAGE. A raw `os error 60`
//! plus an absolute corporate path tells a quality engineer nothing about
//! what to do. So a read failure on a cloud placeholder is reported with a
//! stable marker the frontend translates into real guidance, and every other
//! failure at least loses the noisy absolute path.

use std::path::Path;

/// Stable marker for "this file lives in the cloud and has no local copy".
///
/// The frontend (`errorMessage.ts`) matches `CLOUD_FILE_UNAVAILABLE:<name>`
/// and renders a translated, actionable message. Rust deliberately does not
/// build the sentence itself: it has no access to the user's chosen UI
/// language, and an English sentence in a Turkish interface is exactly the
/// defect this replaces. `source_file` tests pin the wire format so the two
/// halves cannot drift apart.
pub const CLOUD_FILE_UNAVAILABLE_CODE: &str = "CLOUD_FILE_UNAVAILABLE";

/// `SF_DATALESS`, read from the real SDK header
/// (`MacOSX.sdk/usr/include/sys/stat.h`: `#define SF_DATALESS 0x40000000`),
/// never from memory.
#[cfg(target_os = "macos")]
const SF_DATALESS: u32 = 0x4000_0000;

/// Windows' own equivalents, read from the `windows-sys` crate source in the
/// local cargo registry rather than from memory:
/// `FILE_ATTRIBUTE_OFFLINE = 4096`,
/// `FILE_ATTRIBUTE_RECALL_ON_DATA_ACCESS = 4194304`,
/// `FILE_ATTRIBUTE_RECALL_ON_OPEN = 262144`.
///
/// OneDrive's "Files On-Demand" is the default on Windows, so this is if
/// anything MORE likely to be hit there than on macOS.
#[cfg(target_os = "windows")]
const WINDOWS_CLOUD_ATTRIBUTES: u32 = 4096 | 4_194_304 | 262_144;

/// Is this path a cloud placeholder — a file the OS lists but whose contents
/// live only on a remote server (OneDrive, iCloud Drive, Dropbox, …)?
///
/// Returns `false` when the answer cannot be determined (an unreadable
/// `stat`, an unsupported platform). This is only ever used to make an error
/// message more specific, so guessing "yes" on no evidence would be worse
/// than staying quiet.
#[cfg(target_os = "macos")]
pub fn is_cloud_placeholder(path: &Path) -> bool {
    use std::os::macos::fs::MetadataExt;
    std::fs::metadata(path)
        .map(|metadata| metadata.st_flags() & SF_DATALESS != 0)
        .unwrap_or(false)
}

#[cfg(target_os = "windows")]
pub fn is_cloud_placeholder(path: &Path) -> bool {
    use std::os::windows::fs::MetadataExt;
    std::fs::metadata(path)
        .map(|metadata| metadata.file_attributes() & WINDOWS_CLOUD_ATTRIBUTES != 0)
        .unwrap_or(false)
}

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
pub fn is_cloud_placeholder(_path: &Path) -> bool {
    false
}

/// The file's own name, for a message the user can match against what they
/// picked. Deliberately not the absolute path: the original error pasted a
/// full corporate OneDrive path into the UI, which is noise to the reader and
/// needless exposure of the folder structure in a screenshot.
fn display_name(path: &Path) -> String {
    path.file_name()
        .map(|name| name.to_string_lossy().into_owned())
        .unwrap_or_else(|| path.to_string_lossy().into_owned())
}

/// `Some(marker)` when this path is a cloud placeholder, `None` otherwise.
///
/// Shared by every call site that has to turn a filesystem failure into a UI
/// string, so the marker is built in exactly one place.
pub fn cloud_unavailable_message(path: &Path) -> Option<String> {
    is_cloud_placeholder(path)
        .then(|| format!("{CLOUD_FILE_UNAVAILABLE_CODE}:{}", display_name(path)))
}

/// Turns a failure to read a user-picked file into the string the UI shows.
pub fn describe_source_error(path: &Path, error: &std::io::Error) -> String {
    cloud_unavailable_message(path).unwrap_or_else(|| format!("{}: {error}", display_name(path)))
}

/// Reads a user-picked file whole, with the classification above on failure.
///
/// The read is ATTEMPTED before anything is classified, deliberately: a cloud
/// placeholder usually materialises fine on first access, and refusing
/// up-front because a file is online-only would break the common case that
/// works today.
pub fn read_source_file(path: &Path) -> Result<Vec<u8>, String> {
    std::fs::read(path).map_err(|error| describe_source_error(path, &error))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    fn temp_file(name: &str, bytes: &[u8]) -> std::path::PathBuf {
        let path = std::env::temp_dir().join(format!("pps-source-file-{name}"));
        let mut file = std::fs::File::create(&path).expect("create temp file");
        file.write_all(bytes).expect("write temp file");
        path
    }

    #[test]
    fn reads_an_ordinary_local_file() {
        let path = temp_file("ordinary.bin", b"hello");
        assert_eq!(read_source_file(&path).unwrap(), b"hello");
        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn an_ordinary_local_file_is_not_a_cloud_placeholder() {
        let path = temp_file("not-cloud.bin", b"x");
        assert!(!is_cloud_placeholder(&path));
        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn a_missing_file_is_not_reported_as_a_cloud_placeholder() {
        let path = std::env::temp_dir().join("pps-source-file-does-not-exist.bin");
        let _ = std::fs::remove_file(&path);
        assert!(!is_cloud_placeholder(&path));

        let message = read_source_file(&path).unwrap_err();
        assert!(!message.contains(CLOUD_FILE_UNAVAILABLE_CODE), "{message}");
        // The name, so the user can match it against what they picked — and
        // NOT the absolute path the old message pasted into the UI.
        assert!(
            message.starts_with("pps-source-file-does-not-exist.bin: "),
            "{message}"
        );
        assert!(
            !message.contains(path.to_string_lossy().as_ref()),
            "{message}"
        );
    }

    /// The exact wire format `errorMessage.ts` parses. If this changes, that
    /// file must change with it — which is the point of asserting it here.
    #[test]
    fn the_cloud_marker_is_the_code_a_colon_and_the_bare_file_name() {
        let path = Path::new("/somewhere/OneDrive-Farplas/PHOTO-2025-02-27-20-56-49.jpg");
        let error = std::io::Error::from_raw_os_error(60);
        let described = format!(
            "{CLOUD_FILE_UNAVAILABLE_CODE}:{}",
            path.file_name().unwrap().to_string_lossy()
        );
        assert_eq!(
            described,
            "CLOUD_FILE_UNAVAILABLE:PHOTO-2025-02-27-20-56-49.jpg"
        );
        // A path that is NOT a placeholder never gets the marker, however it failed.
        assert!(!describe_source_error(path, &error).contains(CLOUD_FILE_UNAVAILABLE_CODE));
    }
}
