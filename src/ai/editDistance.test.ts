import { describe, expect, it } from "vitest";
import { normalizedEditDistance } from "./editDistance";

describe("normalizedEditDistance", () => {
  it("is 0 for identical strings", () => {
    expect(normalizedEditDistance("same", "same")).toBe(0);
  });

  it("is 0 for two empty strings", () => {
    expect(normalizedEditDistance("", "")).toBe(0);
  });

  it("is 1 for completely different strings of the same length", () => {
    expect(normalizedEditDistance("aaaa", "bbbb")).toBe(1);
  });

  it("is between 0 and 1 for a partial edit", () => {
    const distance = normalizedEditDistance("kitten", "sitting");
    // Classic Levenshtein("kitten", "sitting") == 3, normalized by max length 7.
    expect(distance).toBeCloseTo(3 / 7, 10);
  });

  it("normalizes by the longer string's length", () => {
    const distance = normalizedEditDistance("a", "aaaaaaaaaa");
    expect(distance).toBeCloseTo(9 / 10, 10);
  });

  it("is symmetric", () => {
    expect(normalizedEditDistance("abc", "abcdef")).toBeCloseTo(normalizedEditDistance("abcdef", "abc"), 10);
  });

  it("handles realistic JSON-stringified payload drift", () => {
    const before = JSON.stringify({ unit: "count", categories: [{ id: "a", label: "A", count: 5 }] });
    const after = JSON.stringify({ unit: "count", categories: [{ id: "a", label: "A", count: 8 }] });

    const distance = normalizedEditDistance(before, after);

    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeLessThan(0.2);
  });
});
