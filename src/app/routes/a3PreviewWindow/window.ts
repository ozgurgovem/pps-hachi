import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { emit, emitTo, listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { A3LayoutDescriptor } from "../../../a3/descriptor";

/**
 * Must match `src-tauri/capabilities/a3-preview.json`'s `"windows"` entry
 * exactly — a mismatch here silently strips the new window of every
 * permission (it would open, but `listen()` inside it would never fire),
 * with no error surfaced anywhere a user could find it.
 */
export const A3_PREVIEW_WINDOW_LABEL = "a3-preview";

/** Pushed from the main window whenever `RightPanel` rebuilds the descriptor. */
export const A3_PREVIEW_DESCRIPTOR_EVENT = "a3-preview:descriptor";

/**
 * Broadcast (not targeted — see below) by the preview window right after it
 * starts listening for `A3_PREVIEW_DESCRIPTOR_EVENT`. Closes a real race:
 * `new WebviewWindow(...)` creates the native window asynchronously, so a
 * push sent immediately after opening it can arrive before that window's
 * own `listen()` call has registered and be lost — Tauri does not queue or
 * replay events for late listeners. The ready signal turns "push once after
 * opening" into "push whenever asked," which has no timing assumption.
 *
 * Plain `emit` rather than `emitTo("main", …)`: the preview window has no
 * reliable way to learn the main window's actual label (it is not
 * necessarily "main" by convention alone, and hardcoding it would be a
 * silent, hard-to-notice failure mode if that ever changed) — broadcasting
 * and letting `RightPanel` be the only listener sidesteps the question
 * entirely.
 */
export const A3_PREVIEW_READY_EVENT = "a3-preview:ready";

/**
 * Opens the pop-out preview window, or focuses the existing one rather than
 * creating a second — a second `WebviewWindow` constructed with a label
 * already in use throws, so this checks first (2026-08-04, Barış's request
 * for a real OS window over widening the in-panel preview further, since
 * even `w-[70vw]` (D-131) still could not show the whole A3 sheet at a
 * readable size).
 */
export async function openOrFocusA3PreviewWindow(): Promise<void> {
  const existing = await WebviewWindow.getByLabel(A3_PREVIEW_WINDOW_LABEL);
  if (existing) {
    await existing.setFocus();
    return;
  }

  const created = new WebviewWindow(A3_PREVIEW_WINDOW_LABEL, {
    url: "index.html#/a3-preview",
    title: "PPS Hachi — A3 Preview",
    width: 1100,
    height: 850,
    focus: true,
  });
  // Construction is fire-and-forget on the JS side; the backend creates the
  // native window asynchronously. Never silently swallow a creation failure
  // (a capability/permission mismatch, most likely) — there is no dedicated
  // UI surface for this yet, so a console error is the honest minimum.
  created.once("tauri://error", (event) => {
    console.error("Failed to open the A3 preview window", event);
  });
}

/**
 * No-ops when the preview window isn't open — the main window doesn't track
 * "is it open" as its own state, it just checks on every push. Cheap: this
 * only fires when `RightPanel` finishes building a new descriptor, not on
 * every keystroke.
 */
export async function pushDescriptorToPreviewWindow(descriptor: A3LayoutDescriptor): Promise<void> {
  const existing = await WebviewWindow.getByLabel(A3_PREVIEW_WINDOW_LABEL);
  if (!existing) {
    return;
  }
  await emitTo(A3_PREVIEW_WINDOW_LABEL, A3_PREVIEW_DESCRIPTOR_EVENT, descriptor);
}

/** Main window (`RightPanel`) side of the ready handshake — see `A3_PREVIEW_READY_EVENT`. */
export function listenForPreviewReady(onReady: () => void): Promise<UnlistenFn> {
  return listen(A3_PREVIEW_READY_EVENT, onReady);
}

/** Preview window side: registers the descriptor listener, then announces readiness. */
export async function listenForDescriptorPush(
  onDescriptor: (descriptor: A3LayoutDescriptor) => void,
): Promise<UnlistenFn> {
  const unlisten = await listen<A3LayoutDescriptor>(A3_PREVIEW_DESCRIPTOR_EVENT, (event) =>
    onDescriptor(event.payload),
  );
  await emit(A3_PREVIEW_READY_EVENT);
  return unlisten;
}
