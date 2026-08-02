use std::path::PathBuf;

/// D-55: Rust is strict about the `.ppsx` zip container itself (bounds, path safety)
/// but dumb about `ProjectModel`'s content — so every variant here describes a
/// container-level or filesystem-level failure, never a domain-shape one.
#[derive(Debug, thiserror::Error)]
pub enum PpsxError {
    #[error("io error at {path}: {source}")]
    Io {
        path: PathBuf,
        #[source]
        source: std::io::Error,
    },

    #[error("zip error: {0}")]
    Zip(#[from] zip::result::ZipError),

    #[error("json error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("corrupt .ppsx: {0}")]
    Corrupt(String),

    #[error("'{name}' uncompressed size {actual} exceeds the {limit} byte per-entry cap")]
    EntryTooLarge {
        name: String,
        actual: u64,
        limit: u64,
    },

    #[error("archive uncompressed size {actual} exceeds the {limit} byte total cap")]
    ArchiveTooLarge { actual: u64, limit: u64 },

    #[error("archive has {actual} entries, exceeding the {limit} entry cap")]
    TooManyEntries { actual: usize, limit: usize },

    #[error("unsafe entry name '{0}' — rejected (path traversal, absolute path, or symlink)")]
    UnsafeEntryName(String),

    /// D-77: the file on disk was modified since it was last read — the
    /// caller's `expectedModifiedMs` no longer matches. Never overwritten
    /// silently in either direction; the caller decides what to do next.
    #[error(
        "file changed on disk since it was last read (expected mtime {expected}, found {actual})"
    )]
    Conflict { expected: u64, actual: u64 },
}

impl PpsxError {
    pub fn io(path: impl Into<PathBuf>, source: std::io::Error) -> Self {
        Self::Io {
            path: path.into(),
            source,
        }
    }
}
