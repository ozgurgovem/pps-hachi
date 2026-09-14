import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router";
import { router } from "./app/routes/router";
import { ThemeProvider, TooltipProvider } from "./ui";
import "./i18n";
import "./index.css";

// Faz 8 Dilim 3 (D-20): only the `vite build --mode e2e` build (never `npm
// run build`, the real production build) sets MODE to "e2e" — Vite inlines
// import.meta.env.MODE as a literal at build time, so this branch and the
// @wdio/tauri-plugin import it guards are dead-code-eliminated out of every
// real build. The plugin exposes window.wdioTauri for browser.tauri.execute(),
// and forwards frontend console output to the CI log — both still useful
// even though this app no longer relies on its own `browser.tauri.mock()`
// for dialog interception (see `src/testing/nativeDialogs.ts`'s own header
// comment, CI-kirmizi-durum-devam-2.md, 2026-09-14: real Tauri v2 defines
// `window.__TAURI_INTERNALS__.invoke` — and the `__TAURI_INTERNALS__`
// object reference itself — as non-writable and non-configurable, so no
// JS-side patch of either can ever work, confirmed directly via
// `Object.getOwnPropertyDescriptor` in a real webview; `nativeDialogs.ts`
// mocks at the `save`/`open` call level instead, through a plain, fully
// writable `window` property this app owns).
if (import.meta.env.MODE === "e2e") {
  void import("@wdio/tauri-plugin");
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
