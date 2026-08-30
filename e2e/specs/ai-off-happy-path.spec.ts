import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { browser, $, expect } from "@wdio/globals";

const STEP_IDS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

/**
 * D-20 (LOCKED, Gün-1): "the app is fully functional with AI off... verified
 * by a Playwright suite that runs the whole happy path with no keys
 * configured." Faz 8 Dilim 3 implements this literally against the tool
 * chosen in DECISIONS.md (WebdriverIO, not Playwright — SPEC.md's own
 * wording was corrected, see the same D-number). Scope is §2.2 of
 * docs/oturumlar/faz8-dilim3-playwright-ai-kapali.md: launch, create a
 * project with no AI step, one generic-text entry per step, a rendered
 * preview, a real .xlsx on disk, and no Assistant tab. It deliberately does
 * NOT attempt SPEC.md §9's full acceptance test (3+ methods per step, 6
 * photos, 2 Pareto charts) — that is out of this dilim's budget.
 *
 * No keys are ever configured in this run — a freshly created project has
 * `meta.ai.enabled: false` by default (nothing in this spec touches
 * Settings), which is exactly the state D-20 asks to be exercised.
 */
describe("AI kapalı mutlu yol (D-20)", () => {
  let workDir: string;
  let projectPath: string;
  let exportPath: string;

  before(() => {
    workDir = mkdtempSync(path.join(tmpdir(), "pps-hachi-e2e-"));
    projectPath = path.join(workDir, "e2e-test-project.ppsx");
    exportPath = path.join(workDir, "e2e-test-export.xlsx");
  });

  after(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  it("shows the launch screen with no AI configured", async () => {
    const heading = await $("h1*=PPS Hachi");
    await expect(heading).toBeDisplayed();
  });

  it("creates a new project with no AI step in the way", async () => {
    // The native "Save As" dialog `save()` opens is outside the webview — no
    // WebDriver protocol can drive it. `plugin:dialog|save`'s exact IPC
    // command string was confirmed by reading
    // node_modules/@tauri-apps/plugin-dialog/dist-js/index.js directly, not
    // assumed. Everything downstream of this one mocked call (project
    // creation, ppsx_write, the whole rest of this spec) runs for real.
    //
    // HONESTLY UNVERIFIED (same class of gap as D-105/D-113/D-136/D-200/
    // D-201 — no display/Tauri runtime in this environment): this app calls
    // `invoke()` via the `@tauri-apps/api/core` ESM import, which forwards
    // to `window.__TAURI_INTERNALS__.invoke` — NOT via the `window.__TAURI__`
    // global object tauri-plugin-wdio's own docs describe intercepting.
    // `withGlobalTauri: true` (e2e/tauri.e2e.conf.json) makes `window.__TAURI__`
    // exist, and the plugin's own "sets up invoke interception" step runs
    // once at import time (not per-`execute()`-call), which is only
    // consistent with a real Tauri app's UI-triggered calls if it patches
    // the shared underlying hook rather than only the `window.__TAURI__`
    // mirror — but this was never confirmed by running it. If this mock
    // does not actually intercept the real button's `save()` call, this
    // test fails on a real native dialog opening with nothing to dismiss
    // it, rather than passing — a loud failure, not a silent false pass.
    const saveDialogMock = await browser.tauri.mock("plugin:dialog|save");
    await saveDialogMock.mockResolvedValueOnce(projectPath);

    await (await $("button*=New PPS Project")).click();

    const projectHeading = await $("h1*=e2e-test-project");
    await projectHeading.waitForDisplayed({ timeout: 15000 });
  });

  it("adds a generic-text entry in every one of the 8 steps", async () => {
    for (const stepId of STEP_IDS) {
      await (await $(`button[aria-label^="Step ${stepId}:"]`)).click();

      // D-169/C6: `genericText` never gets a `tier`, so "Free text" always
      // lives in the collapsed "Other formats" disclosure.
      const otherToggle = await $("button*=other formats");
      if ((await otherToggle.isExisting()) && (await otherToggle.getAttribute("aria-expanded")) === "false") {
        await otherToggle.click();
      }

      // Scope to the "Free text" card specifically — a step with a second
      // recommended method (e.g. Pareto on Step 2) has more than one
      // identically-labeled "Add entry" button on screen at once. `.="..."`
      // (not `text()="..."`) compares the whole element's string value, so
      // this doesn't assume anything about the shared Button primitive's
      // internal DOM depth.
      const freeTextCard = await $('//div[span[.="Free text"]]');
      const addEntryButton = await freeTextCard.$("button=Add entry");
      await addEntryButton.click();

      const dialog = await $('[role="dialog"]');
      await dialog.waitForDisplayed();
      await (await dialog.$("#entry-title")).setValue(`Step ${stepId} note`);
      await (await dialog.$("#generic-text-editor")).setValue(`Step ${stepId} note body`);
      await (await dialog.$("button=Save")).click();
      await dialog.waitForExist({ reverse: true });
    }
  });

  it("renders the A3 preview without error", async () => {
    const errorText = await $("*=could not be built");
    await expect(errorText).not.toBeExisting();

    const exportButton = await $("button*=Export A3");
    await browser.waitUntil(async () => exportButton.isEnabled(), {
      timeout: 30000,
      timeoutMsg: "Export A3 button never became enabled — the descriptor build never reached status \"ok\"",
    });
  });

  it("exports a real .xlsx file to disk", async () => {
    const saveDialogMock = await browser.tauri.mock("plugin:dialog|save");
    await saveDialogMock.mockResolvedValueOnce(exportPath);

    await (await $("button*=Export A3")).click();

    await browser.waitUntil(() => existsSync(exportPath), {
      timeout: 30000,
      timeoutMsg: `Export A3 never produced a file at ${exportPath}`,
    });

    // A real .xlsx is a real zip archive — its first two bytes are the
    // local-file-header magic "PK". This does not open/parse the workbook
    // (that level of fidelity is Phase 4's own xlsx.rs test suite's job) —
    // it only proves a real file was written by the real Rust command, not
    // a mock's "success" return value.
    const header = readFileSync(exportPath).subarray(0, 2);
    expect(header.toString("latin1")).toBe("PK");

    const alert = await $('[role="alert"]');
    await expect(alert).not.toBeExisting();
  });

  it("never shows the Assistant tab — meta.ai.enabled stays false", async () => {
    const assistantTab = await $("button*=Assistant");
    await expect(assistantTab).not.toBeExisting();
  });
});
