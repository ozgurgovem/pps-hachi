import { afterEach, describe, expect, test, vi } from "vitest";
import { hasIntroPlayedThisSession, markIntroPlayed, prefersReducedMotion, shouldShowIntro } from "./introSeen";

function mockReducedMotion(matches: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({ matches }) as unknown as typeof window.matchMedia;
}

afterEach(() => {
  sessionStorage.clear();
  mockReducedMotion(false);
});

describe("hasIntroPlayedThisSession / markIntroPlayed", () => {
  test("is false until markIntroPlayed is called", () => {
    expect(hasIntroPlayedThisSession()).toBe(false);
    markIntroPlayed();
    expect(hasIntroPlayedThisSession()).toBe(true);
  });
});

describe("prefersReducedMotion", () => {
  test("reflects the matchMedia query", () => {
    mockReducedMotion(true);
    expect(prefersReducedMotion()).toBe(true);
    mockReducedMotion(false);
    expect(prefersReducedMotion()).toBe(false);
  });
});

describe("shouldShowIntro", () => {
  test("is false in the test environment, regardless of everything else", () => {
    expect(shouldShowIntro("test")).toBe(false);
  });

  test("is false when the user prefers reduced motion", () => {
    mockReducedMotion(true);
    expect(shouldShowIntro("production")).toBe(false);
  });

  test("is false once the intro already played this session", () => {
    markIntroPlayed();
    expect(shouldShowIntro("production")).toBe(false);
  });

  test("is true on a first, motion-permitting, non-test mount", () => {
    expect(shouldShowIntro("production")).toBe(true);
  });
});
