import { describe, expect, it } from "vitest";
import { layoutGapBands } from "./chartLayout";

const FONT_PX = 16;
const COMPACT_WIDTH_PX = 226.7; // ~170pt at 96/72 px-per-pt
const MAX_WIDTH_PX = 1200;

describe("layoutGapBands", () => {
  it("keeps every band on one line, at the compact width, when all texts are short", () => {
    const layout = layoutGapBands(["İdeal: a", "Mevcut: b", "Boşluk: c"], FONT_PX, COMPACT_WIDTH_PX, MAX_WIDTH_PX);

    expect(layout.widthPx).toBeCloseTo(COMPACT_WIDTH_PX, 0);
    expect(layout.wrappedBands.every((lines) => lines.length === 1)).toBe(true);
  });

  it("widens only as far as the longest band's own two-line minimum needs — real BVVL example (round 4)", () => {
    const bandTexts = [
      "İdeal Durum: Maksimum fire oranı %3'ün altında olmalı",
      "Mevcut Durum: Ortalama fire oranı %16,4",
      "Problem Tanımı: İdeal durum ile mevcut durum arasında %13,4'lük bir sapma bulunmaktadır.",
    ];

    const layout = layoutGapBands(bandTexts, FONT_PX, COMPACT_WIDTH_PX, MAX_WIDTH_PX);

    // Barış's own correction: a short sibling band must not be force-wrapped
    // just because a longer one needs two lines.
    expect(layout.wrappedBands[0]).toHaveLength(1);
    expect(layout.wrappedBands[1]).toHaveLength(1);
    expect(layout.wrappedBands[2]).toHaveLength(2);
    expect(layout.widthPx).toBeGreaterThan(COMPACT_WIDTH_PX);
  });

  it("never exceeds the maximum width, even for an extremely long band", () => {
    const longText = "Problem tanımı ".repeat(30).trim();
    const layout = layoutGapBands(["short", "short", longText], FONT_PX, COMPACT_WIDTH_PX, MAX_WIDTH_PX);

    expect(layout.widthPx).toBeLessThanOrEqual(MAX_WIDTH_PX);
  });

  it("never goes narrower than the compact width, even for very short bands", () => {
    const layout = layoutGapBands(["a", "b", "c"], FONT_PX, COMPACT_WIDTH_PX, MAX_WIDTH_PX);
    expect(layout.widthPx).toBeGreaterThanOrEqual(COMPACT_WIDTH_PX - 0.5);
  });

  it("returns exactly as many wrapped-line arrays as input bands, in order", () => {
    const layout = layoutGapBands(["one", "two", "three"], FONT_PX, COMPACT_WIDTH_PX, MAX_WIDTH_PX);
    expect(layout.wrappedBands).toHaveLength(3);
  });
});
