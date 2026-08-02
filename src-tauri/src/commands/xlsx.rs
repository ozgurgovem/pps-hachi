use crate::xlsx::{write_a3_workbook, A3LayoutDescriptor};

/// D-04: this command is a thin IPC wrapper — all it does is deserialize the
/// descriptor Tauri already handed it, call the dumb serializer, and write
/// the resulting bytes. No layout decision is made in Rust anywhere in this
/// path.
#[tauri::command]
pub fn xlsx_export(descriptor: A3LayoutDescriptor, dest_path: String) -> Result<(), String> {
    let bytes = write_a3_workbook(&descriptor).map_err(|e| e.to_string())?;
    std::fs::write(&dest_path, bytes).map_err(|e| format!("{dest_path}: {e}"))
}
