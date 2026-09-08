import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { emit, emitTo, listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { A3LayoutDescriptor } from "../../../a3/descriptor";
import type { StepId } from "../../../domain/model";

/**
 * Must match `src-tauri/capabilities/a3-preview.json`'s `"windows"` entry
 * exactly — a mismatch here silently strips the new window of every
 * permission (it would open, but `listen()` inside it would never fire),
 * with no error surfaced anywhere a user could find it.
 */
export const A3_PREVIEW_WINDOW_LABEL = "a3-preview";

/** Pushed from the main window whenever `useA3PreviewSync` (W2/D-217; formerly `RightPanel`) rebuilds the descriptor. */
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
 * and letting the main window be the only listener sidesteps the question
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
 *
 * Every Tauri call here maps to a *specific* command, each gated by its own
 * permission — matching the wrong one is silent, not a build error, and was
 * a real bug: `getByLabel`/`setFocus` felt like they "should" fall under a
 * generic window permission, but each invokes its own named command:
 *   - `WebviewWindow.getByLabel` → `plugin:window|get_all_windows`
 *     → covered by `core:default` (`core:window:default` already includes
 *       `allow-get-all-windows`).
 *   - `new WebviewWindow(...)` → `plugin:webview|create_webview_window`
 *     → **not** covered by `core:default` — needs the explicit
 *       `core:webview:allow-create-webview-window` in `default.json`.
 *   - `existing.setFocus()` → `plugin:window|set_focus`
 *     → **not** covered by `core:default` either (its window defaults are
 *       read-only queries: `is-focused`, `is-visible`, … not `set-focus`) —
 *       needs the explicit `core:window:allow-set-focus`.
 * Getting either of the last two wrong doesn't throw where you'd notice: the
 * `invoke()` call underneath simply rejects, and a bare
 * `void openOrFocusA3PreviewWindow()` at the call site swallows that
 * silently — clicking the button does visibly nothing. Caught this way
 * 2026-08-04: Barış reported the button as "unclickable," which read at
 * first like a CSS hit-test bug (Anayasa D-12's class) and was actually a
 * missing-permission rejection with no error surfaced anywhere.
 */
export async function openOrFocusA3PreviewWindow(): Promise<void> {
  try {
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
    // Construction is fire-and-forget on the JS side; the backend creates
    // the native window asynchronously — this covers failures reported
    // *after* construction (e.g. the webview process itself crashing),
    // distinct from the synchronous-ish rejections the try/catch below
    // covers (a denied `invoke`, most commonly a permission mismatch).
    created.once("tauri://error", (event) => {
      console.error("Failed to open the A3 preview window", event);
    });
  } catch (error) {
    // Never silently swallow — see the permission-mapping note above for
    // why this specific call is the one most likely to fail quietly.
    console.error("Failed to open or focus the A3 preview window", error);
  }
}

/**
 * No-ops when the preview window isn't open — the main window doesn't track
 * "is it open" as its own state, it just checks on every push. Cheap: this
 * only fires when `useA3PreviewSync` finishes building a new descriptor, not on
 * every keystroke.
 */
export async function pushDescriptorToPreviewWindow(descriptor: A3LayoutDescriptor): Promise<void> {
  try {
    const existing = await WebviewWindow.getByLabel(A3_PREVIEW_WINDOW_LABEL);
    if (!existing) {
      return;
    }
    await emitTo(A3_PREVIEW_WINDOW_LABEL, A3_PREVIEW_DESCRIPTOR_EVENT, descriptor);
  } catch (error) {
    // Every call site fires this with `void` on every descriptor rebuild —
    // never let a rejection here vanish silently, even though a single
    // missed push self-heals on the next edit.
    console.error("Failed to push the A3 descriptor to the preview window", error);
  }
}

/**
 * Main window (`useA3PreviewSync`, formerly `RightPanel`) side of the ready handshake — see
 * `A3_PREVIEW_READY_EVENT`. Wrapped in try/catch like its two siblings
 * above (D-134, when this lived in `RightPanel`; now `useA3PreviewSync`) — this one was missed in that pass: the mount
 * effect calls this without `await`/`.catch`, so an unhandled `listen()`
 * rejection (e.g. no Tauri runtime, as in every test environment) escaped
 * as a genuinely unhandled promise rejection rather than a visible error.
 * Falls back to a no-op unlisten function so a failed subscribe degrades
 * to "the ready handshake never fires" instead of crashing the mount.
 */
export async function listenForPreviewReady(onReady: () => void): Promise<UnlistenFn> {
  try {
    return await listen(A3_PREVIEW_READY_EVENT, onReady);
  } catch (error) {
    console.error("Failed to listen for the A3 preview window's ready signal", error);
    return async () => {};
  }
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

/**
 * Faz 11/L3b (D-170): `BlockPinOverlay`'s own drag-handle, rendered inside
 * the pop-out preview window too (Barış's own explicit choice — the small
 * in-panel preview is too cramped for precise dragging), has no project
 * store to dispatch a `blockPins.set` command against there (D-133's own
 * deliberate isolation: the preview window is a separate JS runtime with no
 * Zustand store). This is the reverse direction of
 * `A3_PREVIEW_DESCRIPTOR_EVENT` — the preview window asks the main window to
 * apply the change instead. Broadcast, same reasoning as
 * `A3_PREVIEW_READY_EVENT`: the preview window has no reliable way to learn
 * the main window's actual label.
 */
export const A3_PREVIEW_PIN_REQUEST_EVENT = "a3-preview:pin-request";

export interface BlockPinRequest {
  readonly stepId: StepId;
  /** Present = set/replace this block's pin to this many canvas rows; absent = clear it (reset to automatic). */
  readonly canvasRows?: number;
}

/** Preview window side: asks the main window to set or clear one block's pin. */
export async function requestBlockPin(request: BlockPinRequest): Promise<void> {
  try {
    await emit(A3_PREVIEW_PIN_REQUEST_EVENT, request);
  } catch (error) {
    console.error("Failed to send a block-pin request from the A3 preview window", error);
  }
}

/** Main window (`useA3PreviewSync`, formerly `RightPanel`) side: listens for a pin request from the preview window. */
export async function listenForBlockPinRequest(onRequest: (request: BlockPinRequest) => void): Promise<UnlistenFn> {
  try {
    return await listen<BlockPinRequest>(A3_PREVIEW_PIN_REQUEST_EVENT, (event) => onRequest(event.payload));
  } catch (error) {
    console.error("Failed to listen for block-pin requests from the A3 preview window", error);
    return async () => {};
  }
}
