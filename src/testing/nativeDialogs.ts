import { open as realOpen, save as realSave, type OpenDialogOptions, type OpenDialogReturn } from "@tauri-apps/plugin-dialog";

// CI-kirmizi-durum-devam-2.md (2026-09-14), replacing `e2eInvokeMockBridge.ts`'s
// now-proven-unworkable approach. Root cause, confirmed by direct instrumentation
// in a real webview (`Object.getOwnPropertyDescriptor`), not guessed: real Tauri
// v2 defines `window.__TAURI_INTERNALS__.invoke` — and the whole
// `window.__TAURI_INTERNALS__` object reference on `window` itself — as
// `writable: false, configurable: false`. Assigning to it (what the deleted
// bridge tried) throws a TypeError in strict-mode ES-module code, and since
// that throw happened inside an unguarded `setTimeout` callback, it silently
// killed the whole retry chain with no visible symptom beyond "the mocked
// dialog never resolves" — the exact E2E failure this file replaces the fix
// for. `@wdio/tauri-plugin`'s own `browser.tauri.mock()` mechanism only ever
// patches the OTHER, unlocked `window.__TAURI__.core.invoke` (confirmed via
// its own source and docs) — which this app's real `invoke()` import (from
// `@tauri-apps/api/core`) never reads, so that mechanism was never reachable
// for this app's own dialog calls either way, in native/embedded mode.
//
// This sidesteps the whole locked-property problem: `save`/`open` are wrapped
// here, and an E2E test sets a mock via a plain, ordinary — fully writable —
// `window` property this app itself owns (`window.__e2e_dialog_mocks__`),
// never touching anything Tauri defines. In a real build,
// `import.meta.env.MODE !== "e2e"` is a build-time-inlined `false` (Vite's
// `define`), so the mock branch below is dead-code-eliminated — the real
// `save`/`open` calls are the only code that ships.

export interface E2eDialogMocks {
  save?: (options: Parameters<typeof realSave>[0]) => ReturnType<typeof realSave>;
  open?: <T extends OpenDialogOptions>(options: T | undefined) => Promise<OpenDialogReturn<T>>;
}

function e2eDialogMocks(): E2eDialogMocks | undefined {
  if (import.meta.env.MODE !== "e2e") {
    return undefined;
  }
  return (window as unknown as { __e2e_dialog_mocks__?: E2eDialogMocks }).__e2e_dialog_mocks__;
}

export function save(options?: Parameters<typeof realSave>[0]): ReturnType<typeof realSave> {
  const mock = e2eDialogMocks()?.save;
  return mock ? mock(options) : realSave(options);
}

export function open<T extends OpenDialogOptions>(options?: T): Promise<OpenDialogReturn<T>> {
  const mock = e2eDialogMocks()?.open;
  return mock ? mock<T>(options) : realOpen(options);
}
