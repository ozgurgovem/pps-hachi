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
    // P-49/D-239/D-240: this app calls `invoke()` via the `@tauri-apps/api/
    // core` ESM import, which forwards to `window.__TAURI_INTERNALS__.invoke`
    // directly — NOT via the `window.__TAURI__` property `@wdio/tauri-
    // plugin`'s own mock interception actually patches (confirmed by reading
    // both packages' real source, not assumed). `src/testing/
    // e2eInvokeMockBridge.ts` (e2e-mode-only, dead-code-eliminated from every
    // real build) bridges that gap by patching `window.__TAURI_INTERNALS__.
    // invoke` itself to consult the same `window.__wdio_mocks__` registry
    // `browser.tauri.mock()` already writes into.
    const saveDialogMock = await browser.tauri.mock("plugin:dialog|save");
    await saveDialogMock.mockResolvedValueOnce(projectPath);

    await (await $("button*=New PPS Project")).click();

    // Faz 11/L1 (D-223/D-224) added a "which language should this project be
    // kept in" dialog between the save-path pick and actual project
    // creation — this spec predates that dialog (D-202) and never accounted
    // for it, which was a second, independent reason "New Project" never
    // completed once this dialog shipped (found via P-69/D-240's own real-CI
    // re-verification, not guessed). Pick English so the rest of this spec's
    // own English-language selectors stay valid.
    const englishOption = await $("button=English");
    await englishOption.waitForDisplayed({ timeout: 15000 });
    await englishOption.click();

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

      // W2/D-217 (§2.1) replaced the modal `EntryEditorDialog` (`role="dialog"`)
      // with an inline accordion panel, `EntryEditorPanel` (`role="group"`,
      // `aria-label="New entry"` for a create) — this spec predates that
      // change (D-202) and never accounted for it either, found the same way
      // as the language-dialog gap above (P-69/D-240).
      const panel = await $('[role="group"][aria-label="New entry"]');
      await panel.waitForDisplayed();
      await (await panel.$("#entry-title")).setValue(`Step ${stepId} note`);
      await (await panel.$("#generic-text-editor")).setValue(`Step ${stepId} note body`);
      await (await panel.$("button=Save")).click();
      await panel.waitForExist({ reverse: true });
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
