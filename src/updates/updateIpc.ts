import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export type { Update };

/**
 * M2/D-238: `check()` resolves to `null` when there is nothing new — the
 * caller distinguishes "checked, nothing found" from "never checked" itself
 * (see `useUpdateCheck`'s own state machine), this wrapper stays a thin pass-
 * through.
 */
export function checkForUpdate(): Promise<Update | null> {
  return check();
}

/**
 * Downloads and installs an already-found update, then relaunches. Per the
 * plugin's own docs: on Windows, `downloadAndInstall` exits the process
 * itself once the installer launches — `relaunch()` below never runs on that
 * platform, the same asymmetry the official usage example itself has (no
 * platform branch needed, the process just doesn't reach that line there).
 */
export async function installUpdateAndRelaunch(update: Update): Promise<void> {
  await update.downloadAndInstall();
  await relaunch();
}
