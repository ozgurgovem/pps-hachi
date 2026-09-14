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
    // WebDriver protocol can drive it. Everything downstream of this one
    // mocked call (project creation, ppsx_write, the whole rest of this
    // spec) runs for real.
    //
    // P-49/D-239/D-240 tried patching `window.__TAURI_INTERNALS__.invoke`
    // itself (this app's real `invoke()`, from `@tauri-apps/api/core`, reads
    // that property directly — NOT `window.__TAURI__.core.invoke`, the only
    // thing `@wdio/tauri-plugin`'s own `browser.tauri.mock()` actually
    // patches in native/embedded mode, confirmed by reading both packages'
    // source). CI-kirmizi-durum-devam-2.md (2026-09-14) found that approach
    // was never actually reachable: real Tauri v2 defines
    // `window.__TAURI_INTERNALS__.invoke` — and the `__TAURI_INTERNALS__`
    // object reference on `window` itself — as non-writable AND
    // non-configurable (confirmed directly via
    // `Object.getOwnPropertyDescriptor` in a real webview), so no JS-side
    // patch of either can ever succeed; the previous bridge's plain
    // assignment threw inside an unguarded callback and silently died,
    // leaving `save()` un-mocked on every real run since D-239 shipped.
    // `src/testing/nativeDialogs.ts` replaces that approach entirely:
    // `LaunchScreen.tsx`/`ProjectToolsBar.tsx` now import `save`/`open` from
    // there instead of directly from `@tauri-apps/plugin-dialog`, and that
    // wrapper checks a plain, ordinary, fully writable `window` property
    // this app itself owns (`window.__e2e_dialog_mocks__`) before falling
    // through to the real dialog — never touching anything Tauri defines.
    await browser.execute((mockedPath: string) => {
      (window as unknown as { __e2e_dialog_mocks__?: Record<string, unknown> }).__e2e_dialog_mocks__ = {
        save: () => Promise.resolve(mockedPath),
      };
    }, projectPath);

    await (await $("button*=New PPS Project")).click();

    // Faz 11/L1 (D-223/D-224) added a "which language should this project be
    // kept in" dialog between the save-path pick and actual project
    // creation — this spec predates that dialog (D-202) and never accounted
    // for it, which was a second, independent reason "New Project" never
    // completed once this dialog shipped (found via P-69/D-240's own real-CI
    // re-verification, not guessed). Pick English so the rest of this spec's
    // own English-language selectors stay valid.
    //
    // CI-kirmizi-durum-devam-2.md (2026-09-14): a bare, unscoped
    // `$("button=English")` is ambiguous and picks the WRONG element —
    // `LaunchScreen.tsx` also renders `<UiLanguageToggle />` (D-242,
    // 2026-09-10) right on the launch screen, and its own button's text
    // (`uiLanguage.english`) is the identical self-referential "English"
    // string, present on screen from the very first frame, before "New PPS
    // Project" is even clicked. In DOM document order that toggle's button
    // sits inside `<main>`, ahead of this dialog's own `Radix Portal`
    // content — so a plain `$()` always resolved to the UI-language toggle
    // instead, which only calls `i18n.changeLanguage("en")` and leaves
    // `pendingProjectPath` untouched, so the dialog never closed and the
    // project was never created. This was never really fixed by D-241's own
    // "add an English click" change — it just clicked the wrong button, 100%
    // reproducibly, on every run since D-242 shipped (confirmed against two
    // separate real CI runs, both platforms, both showing the exact same
    // "creates a new project" timeout — CI-kirmizi-durum-devam-2.md's own
    // claim that this step already passed was a misread of the log, not a
    // real prior state). Scoping to the dialog's own `role="dialog"`
    // (Radix's default a11y role, the same one every other `DialogContent`
    // in this app already carries) makes the query unambiguous.
    const languageDialog = await $('[role="dialog"]');
    await languageDialog.waitForDisplayed({ timeout: 15000 });
    const englishOption = await languageDialog.$("button=English");
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
    // P-70 (CI-kirmizi-durum-devam.md §1, 2026-09-14): the old
    // `"*=could not be built"` check was vacuous — that text hasn't existed
    // anywhere in the app since W3 (D-229) rewrote `A3PreviewReservedBand.tsx`.
    // Confirmed by reading the current code, not guessed: that component (and
    // `useA3PreviewSync`'s own `DescriptorResult`) has no branch that renders
    // ANY text for `status === "error"` today — it only distinguishes "ok"
    // (renders the live crop) from "not ok yet" (a plain "waiting" message,
    // used for both "loading" and "error" alike). So a real descriptor-build
    // failure has no dedicated error text to assert against right now. The
    // wait below is the real, meaningful proof of "no error": `ProjectToolsBar`'s
    // Export A3 button is only ever enabled once `descriptorResult.status ===
    // "ok"` (`disabled={descriptorResult.status !== "ok" || isExporting}`) —
    // reaching "ok" is exactly what "without error" means here.
    const exportButton = await $("button*=Export A3");
    await browser.waitUntil(async () => exportButton.isEnabled(), {
      timeout: 30000,
      timeoutMsg: "Export A3 button never became enabled — the descriptor build never reached status \"ok\"",
    });
  });

  it("exports a real .xlsx file to disk", async () => {
    await browser.execute((mockedPath: string) => {
      (window as unknown as { __e2e_dialog_mocks__?: Record<string, unknown> }).__e2e_dialog_mocks__ = {
        save: () => Promise.resolve(mockedPath),
      };
    }, exportPath);

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

  it("never shows the AI support column — meta.ai.enabled stays false", async () => {
    // P-70 (CI-kirmizi-durum-devam.md §1, 2026-09-14): the old
    // `button*=Assistant` check was vacuous — W2 (D-217/D-228, 2026-09-08)
    // removed `RightPanel` (and its Assistant tab) entirely; there is no
    // element containing the word "Assistant" anywhere in this app's UI any
    // more (`workspace.assistant.columnTitle` reads "AI support"), so the old
    // assertion passed for the wrong reason. The real, current gate is
    // `WorkspaceShell.tsx`'s own `{project.meta.ai.enabled && <AssistantColumn
    // .../>}` — confirmed by reading that file — so the column's own title is
    // what must stay absent.
    const assistantColumnTitle = await $("*=AI support");
    await expect(assistantColumnTitle).not.toBeExisting();
  });
});
