import { describe, expect, it } from "vitest";
import { renderFiveN1KToA3 } from "./renderToA3";
import type { FiveN1KPayload } from "./schema";

function emptyPayload(): FiveN1KPayload {
  return { ne: "", neden: "", nasil: "", kim: "", neZaman: "", nerede: "" };
}

describe("renderFiveN1KToA3 (TEMPLATE_ANALYSIS.md §14.2, D-102 zones)", () => {
  it("emits exactly six equal-width zones, in Ne/Neden/Nasıl/Kim/Ne zaman/Nerede order, and no top-level lines", () => {
    const content = renderFiveN1KToA3(emptyPayload(), { id: "e1", title: "5N1K", language: "tr" });

    expect(content.lines).toEqual([]);
    expect(content.zones).toHaveLength(6);
    expect(content.zones!.every((zone) => zone.widthFraction === 1 / 6)).toBe(true);
    expect(content.zones!.reduce((sum, zone) => sum + zone.widthFraction, 0)).toBeCloseTo(1);
  });

  it("each zone's first line is the bold question label, in reference-image order", () => {
    const content = renderFiveN1KToA3(emptyPayload(), { id: "e1", title: "5N1K", language: "tr" });
    const labels = content.zones!.map((zone) => zone.lines![0]);

    expect(labels).toEqual([
      { text: "NE?", bold: true },
      { text: "NEDEN?", bold: true },
      { text: "NASIL?", bold: true },
      { text: "KİM?", bold: true },
      { text: "NE ZAMAN?", bold: true },
      { text: "NEREDE?", bold: true },
    ]);
  });

  it("appends the user's answer as a second, non-bold line when the field is filled", () => {
    const payload: FiveN1KPayload = { ...emptyPayload(), ne: "Gürültü", kim: "Ayşe Yılmaz" };
    const content = renderFiveN1KToA3(payload, { id: "e1", title: "5N1K", language: "tr" });

    expect(content.zones![0]!.lines).toEqual([{ text: "NE?", bold: true }, { text: "Gürültü" }]);
    expect(content.zones![3]!.lines).toEqual([{ text: "KİM?", bold: true }, { text: "Ayşe Yılmaz" }]);
  });

  it("leaves a zone at just its label line when the field is blank", () => {
    const content = renderFiveN1KToA3(emptyPayload(), { id: "e1", title: "5N1K", language: "tr" });

    expect(content.zones![1]!.lines).toEqual([{ text: "NEDEN?", bold: true }]);
  });

  it("trims whitespace-only answers down to the blank case", () => {
    const payload: FiveN1KPayload = { ...emptyPayload(), nerede: "   " };
    const content = renderFiveN1KToA3(payload, { id: "e1", title: "5N1K", language: "tr" });

    expect(content.zones![5]!.lines).toEqual([{ text: "NEREDE?", bold: true }]);
  });

  /** D-188/P-26: `entry.language` picks the question-word labels, defaulting to English. */
  it("uses English question labels for an English-language entry", () => {
    const content = renderFiveN1KToA3(emptyPayload(), { id: "e1", title: "5N1K", language: "en" });
    const labels = content.zones!.map((zone) => zone.lines![0]);

    expect(labels).toEqual([
      { text: "WHAT?", bold: true },
      { text: "WHY?", bold: true },
      { text: "HOW?", bold: true },
      { text: "WHO?", bold: true },
      { text: "WHEN?", bold: true },
      { text: "WHERE?", bold: true },
    ]);
  });
});
