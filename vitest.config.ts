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
    // Faz 8 Dilim 3 (D-20): `e2e/**/*.spec.ts` are WebdriverIO specs, run
    // only by `npm run test:e2e` — Vitest's own default include pattern
    // (`**/*.{test,spec}.*`) would otherwise also collect them and fail on
    // mocha's `describe`/`it` globals, which this project's `globals: false`
    // deliberately doesn't provide.
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
