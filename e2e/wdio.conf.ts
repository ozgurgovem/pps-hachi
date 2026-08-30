import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// `npm run test:e2e:build` produces this exact path — `tauri build --debug`
// (never `--release`) so Cargo.toml's `[target.'cfg(debug_assertions)'.
// dependencies]` compiles tauri-plugin-wdio/tauri-plugin-wdio-webdriver in,
// and `--no-bundle` skips dmg/nsis packaging since the E2E run only needs
// the raw binary. Standard Cargo debug-profile output path — not Tauri-
// specific, so no separate doc verification was needed for this part.
const binaryName = process.platform === "win32" ? "pps-hachi.exe" : "pps-hachi";
const appBinaryPath = path.join(__dirname, "..", "src-tauri", "target", "debug", binaryName);

// Faz 8 Dilim 3 (D-20). `driverProvider: "embedded"` is the only option that
// covers macOS (this app's target platforms are macOS + Windows only, per
// CLAUDE.md — Linux was never in scope) without a paid CrabNebula
// subscription: confirmed directly against @wdio/tauri-service@1.3.0's own
// README/docs (fetched via npm/jsdelivr, not a WebSearch summary — a
// WebSearch pass on this same package reported a stale 1.0.0-next.0 version
// that the real npm registry contradicted).
export const config: WebdriverIO.Config = {
  runner: "local",
  specs: ["./specs/**/*.spec.ts"],
  maxInstances: 1,
  services: [
    [
      "@wdio/tauri-service",
      {
        appBinaryPath,
        driverProvider: "embedded",
        captureBackendLogs: true,
        captureFrontendLogs: true,
      },
    ],
  ],
  capabilities: [
    {
      browserName: "tauri",
      "tauri:options": {
        application: appBinaryPath,
      },
    },
  ],
  logLevel: "info",
  bail: 0,
  waitforTimeout: 15000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  framework: "mocha",
  reporters: ["spec"],
  mochaOpts: {
    ui: "bdd",
    timeout: 90000,
  },
};
