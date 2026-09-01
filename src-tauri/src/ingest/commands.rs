use serde::Serialize;

use super::{ingest_table_from_path, IngestedTable};

/// What the attachment review sheet (SPEC.md §8.9) actually renders — file
/// name/size come from this command's own `std::fs::metadata` read, not
/// from `IngestedTable` (which stays reader-agnostic and knows nothing
/// about the source path).
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AttachmentPreview {
    pub file_name: String,
    pub file_size_bytes: u64,
    pub table: IngestedTable,
}

/// J2: reads a user-selected xlsx/csv file entirely in Rust — the same
/// "Rust reads the file, the webview never sees raw bytes" posture D-118's
/// image ingestion established, applied to tabular data. Unlike
/// `image_import` (D-193), nothing here is written into the `.ppsx` — a
/// spreadsheet's raw content is never persisted, only the compact summary
/// this command returns, and only for the lifetime of the review sheet /
/// prompt it feeds (SPEC.md §8.13's "prompt bodies are not stored by
/// default" applies transitively).
#[tauri::command]
pub fn ingest_table_preview(source_path: String) -> Result<AttachmentPreview, String> {
    let path = std::path::Path::new(&source_path);
    let file_name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or(&source_path)
        .to_string();
    let file_size_bytes = std::fs::metadata(path).map(|m| m.len()).unwrap_or(0);
    let table = ingest_table_from_path(path).map_err(|e| e.to_string())?;
    Ok(AttachmentPreview {
        file_name,
        file_size_bytes,
        table,
    })
}
