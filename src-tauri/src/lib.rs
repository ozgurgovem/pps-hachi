pub mod ppsx;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            ppsx::commands::ppsx_read,
            ppsx::commands::ppsx_write,
            ppsx::commands::recent_list,
            ppsx::commands::recent_upsert,
            ppsx::commands::history_list,
            ppsx::commands::history_save,
            ppsx::commands::history_read,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Trivial scaffold-verification test (task 0.5) — proves `cargo test` is wired up.
#[cfg(test)]
mod tests {
    fn add(a: i32, b: i32) -> i32 {
        a + b
    }

    #[test]
    fn add_sums_two_integers() {
        assert_eq!(add(2, 3), 5);
    }
}
