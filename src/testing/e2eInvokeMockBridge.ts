// CI-A fix (P-49, docs/oturumlar/CI-kirmizi-durum.md). Root-caused by reading
// source, not guessing: `@tauri-apps/api/core.js`'s `invoke()` calls
// `window.__TAURI_INTERNALS__.invoke(cmd, args, options)` directly — every
// real command this app sends (including `@tauri-apps/plugin-dialog`'s
// `save()`, which this app's own `invoke` import ultimately reaches) goes
// through that one path. `@wdio/tauri-plugin`'s own `setupInvokeInterception()`
// (guest-js/index.ts, native/embedded mode — the mode this app's E2E suite
// uses) patches a *different* property, `window.__TAURI__.core.invoke`, via
// `Object.defineProperty` — confirmed both in its source and in its own docs
// (`@wdio/tauri-service/docs/plugin-setup.md`: "Intercepts
// `window.__TAURI__.core.invoke` for mocking"). A real UI-triggered `invoke()`
// call never reads that property, so `browser.tauri.mock(...)` never sees it —
// the native "Save As" dialog opens for real in CI, with nothing there to
// dismiss it, and the click's own promise never resolves.
//
// This bridges the gap the same way `@wdio/native-spy`'s own browser-mode
// interceptor does for `window.__TAURI_INTERNALS__.invoke` (confirmed via
// node_modules/@wdio/native-spy/dist/esm/interceptor.js) — but for native
// mode, where no package does it: patch `window.__TAURI_INTERNALS__.invoke`
// itself to consult the very registry `@wdio/tauri-plugin`'s own `mock()`
// already writes into, `window.__wdio_mocks__` (confirmed via
// `@wdio/native-spy`'s `buildRegistrationScript`), before falling through to
// the real internals invoke.

export interface TauriInternals {
  invoke: (cmd: string, args?: unknown, options?: unknown) => unknown;
  __wdioMockBridgeInstalled?: boolean;
}

export interface WdioBridgeWindow {
  __TAURI_INTERNALS__?: TauriInternals;
  __wdio_mocks__?: Record<string, ((args?: unknown) => unknown) | undefined>;
}

export function installE2eInvokeMockBridge(target: WdioBridgeWindow): void {
  const internals = target.__TAURI_INTERNALS__;
  if (!internals || typeof internals.invoke !== "function" || internals.__wdioMockBridgeInstalled) {
    return;
  }

  const realInvoke = internals.invoke.bind(internals);
  internals.invoke = (cmd: string, args?: unknown, options?: unknown) => {
    const mockFn = target.__wdio_mocks__?.[cmd];
    return typeof mockFn === "function" ? mockFn(args) : realInvoke(cmd, args, options);
  };
  internals.__wdioMockBridgeInstalled = true;
}

installE2eInvokeMockBridge(window as unknown as WdioBridgeWindow);
