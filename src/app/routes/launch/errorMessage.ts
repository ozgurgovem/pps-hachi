import i18n from "../../../i18n";

/**
 * The stable marker `src-tauri/src/source_file.rs` emits when a file the user
 * picked lives online-only in a cloud folder (OneDrive, iCloud Drive, …) and
 * has no local copy. Rust deliberately does not write the sentence itself —
 * it has no access to the chosen UI language, and an English sentence in a
 * Turkish interface is exactly the defect this replaces. That module's own
 * tests pin this wire format, so the two halves cannot drift apart.
 */
const CLOUD_FILE_UNAVAILABLE_PREFIX = "CLOUD_FILE_UNAVAILABLE:";

/**
 * Every Tauri command in this app returns `Result<_, String>`, and these
 * strings are shown to the user as-is. Most are already readable; the ones
 * that are not carry a marker recognised here and turned into real guidance.
 *
 * 2026-09-23: Barış hit `…/OneDrive-Farplas…/PHOTO-….jpg: Operation timed out
 * (os error 60)` adding a shop-floor photo. Measured on the real machine:
 * the file carries the macOS `dataless` flag — OneDrive holds it online-only
 * and could not download it on demand. Nothing about that is recoverable
 * from the raw text, so it is translated into the one thing the user can
 * actually do about it.
 */
export function errorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  if (raw.startsWith(CLOUD_FILE_UNAVAILABLE_PREFIX)) {
    return i18n.t("errors.cloudFileUnavailable", {
      file: raw.slice(CLOUD_FILE_UNAVAILABLE_PREFIX.length),
    });
  }
  return raw;
}
