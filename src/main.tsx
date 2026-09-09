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
// real build. The plugin exposes window.wdioTauri for browser.tauri.execute()/
// mock() — test-only, never shipped.
if (import.meta.env.MODE === "e2e") {
  void import("@wdio/tauri-plugin");
  // CI-A fix (P-49, docs/oturumlar/CI-kirmizi-durum.md): @wdio/tauri-plugin's
  // own mock interception only patches window.__TAURI__.core.invoke, which
  // this app's real invoke() calls (imported from @tauri-apps/api/core) never
  // read — see e2eInvokeMockBridge.ts's own header comment for the full,
  // source-verified chain. Also dead-code-eliminated from every real build.
  void import("./testing/e2eInvokeMockBridge");
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
