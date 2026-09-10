import { afterEach, describe, expect, test } from "vitest";
import { readStoredUiLanguage, storeUiLanguage } from "./uiLanguage";

afterEach(() => {
  window.localStorage.clear();
});

describe("uiLanguage", () => {
  test("readStoredUiLanguage returns null when nothing was ever stored", () => {
    expect(readStoredUiLanguage()).toBeNull();
  });

  test("readStoredUiLanguage returns null for a garbage stored value", () => {
    window.localStorage.setItem("pps-hachi:ui-language", "fr");
    expect(readStoredUiLanguage()).toBeNull();
  });

  test("storeUiLanguage then readStoredUiLanguage round-trips tr", () => {
    storeUiLanguage("tr");
    expect(readStoredUiLanguage()).toBe("tr");
  });

  test("storeUiLanguage then readStoredUiLanguage round-trips en", () => {
    storeUiLanguage("en");
    expect(readStoredUiLanguage()).toBe("en");
  });

  test("storing a new value overwrites the previous one", () => {
    storeUiLanguage("tr");
    storeUiLanguage("en");
    expect(readStoredUiLanguage()).toBe("en");
  });
});
