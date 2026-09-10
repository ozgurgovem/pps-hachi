/**
 * Real, found-in-use gap (Barış's own first trial run, 2026-09-10): the
 * "Project language" dialog (`LaunchScreen.tsx`'s `chooseLanguage`) only ever
 * set `project.meta.language` — the exported A3's own content language
 * (D-188/D-223) — never the interface's own display language. Nothing
 * anywhere in the codebase ever called `i18n.changeLanguage(...)`, so the UI
 * stayed permanently English regardless of what a user picked. This traces
 * back to `SPEC.md` §2.1's own "language toggle (TR / EN)" line, deferred at
 * Phase 2 (2026-08-02) and never picked back up. `readStoredUiLanguage`/
 * `storeUiLanguage` follow `ThemeProvider.tsx`'s own `readStoredTheme`/
 * `setTheme` shape exactly (same localStorage-preference pattern, no
 * try/catch — this project's own established precedent for this kind of
 * read).
 */

export type UiLanguage = "tr" | "en";

const STORAGE_KEY = "pps-hachi:ui-language";

export function readStoredUiLanguage(): UiLanguage | null {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "tr" || stored === "en" ? stored : null;
}

export function storeUiLanguage(language: UiLanguage): void {
  window.localStorage.setItem(STORAGE_KEY, language);
}
