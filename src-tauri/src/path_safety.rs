/// Faz 10/K4: extracted from `ppsx::history` (D-91/D-92) on its second real
/// use — `ai::usage`'s per-project log sidecar addresses itself by the same
/// untrusted `project_id` (`manifest.id`, read straight out of a `.ppsx` that
/// can arrive by email, D-06) under the same `app_local_data_dir` root.
/// Anayasa Madde 2: a second hand-copy of this exact hardened validator would
/// be the kind of drift a security-relevant check can never afford — one
/// definition, two callers.
///
/// D-91: a single-path-segment safety check. Without it, joining an
/// attacker-chosen `project_id` like `"../../../../Library/LaunchAgents/evil"`
/// onto `app_local_data_dir` would escape it entirely — `PathBuf::join` with
/// an absolute path silently discards the base altogether.
///
/// D-92: an *allowlist*, not a blocklist — host-OS-dependent path semantics
/// (Windows trims trailing spaces/periods during Win32→NT normalization, and
/// resolves reserved device names like `CON`/`NUL`/`COM1` to devices in any
/// directory) make a blocklist a losing, ever-growing game. The values that
/// legitimately reach this check are a `crypto.randomUUID()` (`manifest.id`)
/// and a `YYYY-MM` month key — an allowlist of `[A-Za-z0-9._-]` costs nothing
/// and closes the whole class, including Unicode homoglyph/zero-width/bidi
/// tricks at the same time.
pub(crate) fn is_safe_path_component(value: &str) -> bool {
    const MAX_LEN: usize = 128;
    if value.is_empty() || value.len() > MAX_LEN {
        return false;
    }
    if !value
        .bytes()
        .all(|b| b.is_ascii_alphanumeric() || b == b'.' || b == b'_' || b == b'-')
    {
        return false;
    }
    // `.`, `..`, `...` and every longer run: all-dots names are either a
    // relative component or (3+ dots) trimmed to one by Windows.
    if value.bytes().all(|b| b == b'.') {
        return false;
    }
    // A leading dot hides the directory on Unix; a trailing dot is stripped
    // on Windows, aliasing two different ids onto one directory.
    if value.starts_with('.') || value.ends_with('.') {
        return false;
    }
    !is_windows_reserved_device_name(value)
}

/// Win32 resolves these names to devices in *any* directory, with or without
/// an extension (`CON`, `con.json`, `LPT1.txt`) — creating a directory so
/// named fails, and opening a file so named talks to the device instead.
fn is_windows_reserved_device_name(value: &str) -> bool {
    const RESERVED: [&str; 24] = [
        "CON", "PRN", "AUX", "NUL", "COM0", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7",
        "COM8", "COM9", "LPT0", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8",
        "LPT9",
    ];
    let stem = value.split('.').next().unwrap_or(value);
    RESERVED
        .iter()
        .any(|reserved| stem.eq_ignore_ascii_case(reserved))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn is_safe_path_component_rejects_host_os_dependent_and_reserved_names() {
        for rejected in [
            "",
            ".",
            "..",
            "...",
            ".. ",
            "..  ",
            "foo.",
            "foo ",
            ".hidden",
            "a b",
            "a/b",
            "a\\b",
            "a:b",
            "a\0b",
            "CON",
            "con",
            "NUL",
            "nul.json",
            "COM1",
            "LPT9",
            "aux",
            "café",
            "ı",
            "\u{FF0F}",
            "\u{200B}",
            &"a".repeat(129),
        ] {
            assert!(
                !is_safe_path_component(rejected),
                "should have been rejected: {rejected:?}"
            );
        }
        for accepted in [
            "b3f1c2a0-1234-4a3b-9c9d-0123456789ab",
            "2026-08-02T090000Z",
            "proj-1",
            "a",
            "console",
            "com10",
            "v1.2.3",
            "2026-09",
        ] {
            assert!(
                is_safe_path_component(accepted),
                "should have been accepted: {accepted:?}"
            );
        }
    }
}
