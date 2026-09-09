import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    // jsdom treats the default blank document as an opaque origin, where
    // localStorage throws a SecurityError — ThemeProvider needs a real origin.
    environmentOptions: {
      jsdom: { url: "http://localhost/" },
    },
    globals: false,
    setupFiles: ["./src/test/setup.ts"],
    // CI-B fix (docs/oturumlar/CI-kirmizi-durum.md): vitest's 5000ms default
    // has been flaking on windows-latest CI since Phase 5 (2026-08-03) — a
    // different heavy test times out on almost every Windows run (confirmed
    // across three independent runs' failure logs, always Windows, never
    // macOS, always a different test), consistent with tight timing margin
    // under CI load rather than a deterministic bug. 15000ms gives real
    // headroom to the heaviest tests (e.g. WorkspaceScreen.test.tsx's 8-step
    // x 2-entry CRUD walk) without meaningfully weakening the hang-detection
    // a testTimeout exists for.
    testTimeout: 15000,
    // Faz 8 Dilim 3 (D-20): `e2e/**/*.spec.ts` are WebdriverIO specs, run
    // only by `npm run test:e2e` — Vitest's own default include pattern
    // (`**/*.{test,spec}.*`) would otherwise also collect them and fail on
    // mocha's `describe`/`it` globals, which this project's `globals: false`
    // deliberately doesn't provide.
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
