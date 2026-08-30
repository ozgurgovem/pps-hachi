pub mod ai;
pub mod commands;
pub mod images;
pub mod ppsx;
pub mod xlsx;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init());

    // Faz 8 Dilim 3 (D-20): WebdriverIO's execute/mock/log bridge and its
    // embedded WebDriver server, gated behind the `e2e-test` Cargo feature —
    // never on by default, so a plain `cargo build`/`cargo build --release`
    // (CI's real "Build app (unsigned)" step, and any real Farplas binary)
    // never even resolves these crates (Cargo.toml's `optional = true` +
    // `dep:` feature syntax). `#[cfg(debug_assertions)]` was tried first and
    // empirically disproved — `[target.'cfg(debug_assertions)'.dependencies]`
    // does not vary by profile in Cargo.toml, so `cargo check --release`
    // still pulled both crates in; see Cargo.toml's own comment. The matching
    // `wdio:default`/`wdio-webdriver:default` capability permissions live in
    // `capabilities-e2e/e2e-test.json` — build.rs stages it into
    // `capabilities/` only when this same feature is active, since
    // tauri-build validates every permission in that folder unconditionally,
    // regardless of tauri.conf.json's own capabilities allowlist.
    #[cfg(feature = "e2e-test")]
    let builder = builder
        .plugin(tauri_plugin_wdio::init())
        .plugin(tauri_plugin_wdio_webdriver::init());

    builder
        .invoke_handler(tauri::generate_handler![
            ppsx::commands::ppsx_read,
            ppsx::commands::ppsx_write,
            ppsx::commands::image_import,
            ppsx::commands::recent_list,
            ppsx::commands::recent_upsert,
            ppsx::commands::history_list,
            ppsx::commands::history_save,
            ppsx::commands::history_read,
            commands::xlsx::xlsx_export,
            ai::commands::ai_set_key,
            ai::commands::ai_key_status,
            ai::commands::ai_remove_key,
            ai::commands::ai_test_connection,
            ai::commands::ai_list_models,
            ai::commands::ai_get_settings,
            ai::commands::ai_set_settings,
            ai::commands::ai_complete,
            ai::commands::ai_cancel,
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
