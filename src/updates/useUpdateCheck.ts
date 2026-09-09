import { useCallback, useRef, useState } from "react";
import { errorMessage } from "../app/routes/launch/errorMessage";
import { checkForUpdate, installUpdateAndRelaunch, type Update } from "./updateIpc";

export type UpdateCheckState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "upToDate" }
  | { status: "available"; version: string; currentVersion: string; body: string | undefined }
  | { status: "downloading" }
  | { status: "error"; message: string };

/**
 * M2/D-238: one instance per mounting screen (`LaunchScreen`'s silent
 * on-launch check, `SettingsScreen`'s manual button) — deliberately no
 * shared/global state, matching this codebase's existing "don't invent a
 * store for something a local hook already covers" posture (YAGNI). Holds
 * the real `Update` resource in a ref (never in state — it is not
 * serializable/comparable the way state should be) so `installNow` can reach
 * it without threading it back out through the component.
 */
export function useUpdateCheck() {
  const [state, setState] = useState<UpdateCheckState>({ status: "idle" });
  const updateRef = useRef<Update | null>(null);

  const checkNow = useCallback(async () => {
    setState({ status: "checking" });
    try {
      const update = await checkForUpdate();
      if (update) {
        updateRef.current = update;
        setState({ status: "available", version: update.version, currentVersion: update.currentVersion, body: update.body });
      } else {
        updateRef.current = null;
        setState({ status: "upToDate" });
      }
    } catch (error) {
      updateRef.current = null;
      setState({ status: "error", message: errorMessage(error) });
    }
  }, []);

  const installNow = useCallback(async () => {
    const update = updateRef.current;
    if (!update) {
      return;
    }
    setState({ status: "downloading" });
    try {
      await installUpdateAndRelaunch(update);
      // Windows: the process has already exited by the time
      // `installUpdateAndRelaunch` would resolve — this line is reachable
      // only on macOS, where `relaunch()` has already taken over by then too.
    } catch (error) {
      setState({ status: "error", message: errorMessage(error) });
    }
  }, []);

  return { state, checkNow, installNow };
}
