import { describe, expect, it } from "vitest";
import { statusGlyph, statusGlyphText } from "./statusGlyph";

describe("statusGlyph (D-41/P-37)", () => {
  it.each([
    ["positive", "■"],
    ["caution", "●"],
    ["negative", "▲"],
  ] as const)("maps %s to %s", (tone, glyph) => {
    expect(statusGlyph(tone)).toBe(glyph);
  });
});

describe("statusGlyphText", () => {
  it("prefixes the text with the tone's glyph", () => {
    expect(statusGlyphText("Approved", "positive")).toBe("■ Approved");
  });
});
