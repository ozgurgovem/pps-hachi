const SESSION_KEY = "pps-hachi:intro-shown";

/**
 * `sessionStorage`, not `localStorage`: "once per app launch" (a real splash
 * screen) is what Barış chose over "once ever" or "every visit to /" — the
 * flag lives only as long as the window/session does, so it never persists
 * across a real app restart, but also never replays on an in-session return
 * to the launch screen (closing a project, opening another).
 */
export function hasIntroPlayedThisSession(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    // Storage unavailable (e.g. a locked-down privacy mode) — fail toward
    // never blocking the user behind an intro they can't dismiss and get
    // re-shown every render, not toward replaying it.
    return true;
  }
}

export function markIntroPlayed(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // See hasIntroPlayedThisSession's own fallback — nothing to recover here.
  }
}

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

/**
 * `mode` is injected rather than read from `import.meta.env` here, so this
 * stays a plain, trivially-testable function — the one real call site
 * (`LaunchScreen.tsx`) passes `import.meta.env.MODE`. The "test" branch
 * mirrors D-202's own precedent (`e2eInvokeMockBridge.ts`'s `MODE`-gated
 * dynamic import): a 13-second timer-driven overlay has no business ever
 * mounting inside `npm test`'s jsdom environment.
 */
export function shouldShowIntro(mode: string): boolean {
  if (mode === "test") return false;
  if (prefersReducedMotion()) return false;
  return !hasIntroPlayedThisSession();
}
