use std::path::Path;

fn main() {
    // Faz 8 Dilim 3 (D-20): tauri-build validates every permission in every
    // file under capabilities/ against whatever plugins are actually
    // compiled in, regardless of tauri.conf.json's capabilities allowlist
    // (confirmed by reading tauri-build 2.6.3's acl.rs directly — its
    // validate_capabilities() runs on the raw, unfiltered glob result, not
    // the allowlist-filtered set). So capabilities-e2e/e2e-test.json — whose
    // permissions only resolve when the `e2e-test` feature's plugins are
    // compiled in — can never simply sit inside capabilities/. This
    // reconciles the folder to match the current feature set on every
    // build, feature-on or off, so an interrupted build can never leave a
    // stale copy behind unnoticed by the next one.
    let staged_capability = Path::new("capabilities/e2e-test.json");
    if cfg!(feature = "e2e-test") {
        std::fs::copy("capabilities-e2e/e2e-test.json", staged_capability)
            .expect("failed to stage capabilities-e2e/e2e-test.json for the E2E build");
    } else if staged_capability.exists() {
        std::fs::remove_file(staged_capability)
            .expect("failed to remove a stale e2e-test.json left over from a previous E2E build");
    }

    tauri_build::build()
}
