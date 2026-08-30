mod archive;
mod atomic;
pub mod commands;
mod error;
mod history;
mod manifest;
mod recent_index;
/// D-200: `ai::settings`'s own tests reuse this rather than duplicating it —
/// the same "abstract on second use" call `test_support.rs`'s existing
/// doc comment doesn't need to restate here.
#[cfg(test)]
pub(crate) mod test_support;

pub use archive::{file_modified_ms, read_ppsx, write_ppsx, ArchiveEntry, PpsxContents};
pub use error::PpsxError;
pub use recent_index::{list_recent, upsert as upsert_recent, write_recent_index, RecentEntry};
