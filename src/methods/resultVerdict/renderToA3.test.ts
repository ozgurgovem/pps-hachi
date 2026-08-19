import { describe, expect, it } from "vitest";
import type { A3EntrySummary } from "../../a3/methodContract";
import { renderResultVerdictToA3 } from "./renderToA3";

const ENTRY: A3EntrySummary = { id: "e1", title: "Çapak oranı sonucu" };

describe("renderResultVerdictToA3", () => {
  it("exports the populated fields as label: value lines", () => {
    const lines = renderResultVerdictToA3({ verdict: "met", notes: "Confirmed over 6 weeks" }, ENTRY).lines;

    expect(lines).toEqual([
      { text: "■ Çapak oranı sonucu", bold: true, tone: "positive" },
      { text: "Verdict: met" },
      { text: "Notes: Confirmed over 6 weeks" },
    ]);
  });

  it("drops blank fields", () => {
    const lines = renderResultVerdictToA3({ verdict: "", notes: "" }, ENTRY).lines;
    expect(lines).toEqual([{ text: "Çapak oranı sonucu", bold: true }]);
  });

  /** P-37: D-41's shape-coded status marker on the title line; `pending` carries none. */
  it.each([
    ["met", "■", "positive"],
    ["partiallyMet", "●", "caution"],
    ["notMet", "▲", "negative"],
  ] as const)("marks verdict %s with glyph %s and tone %s", (verdict, glyph, tone) => {
    const lines = renderResultVerdictToA3({ verdict, notes: "" }, ENTRY).lines;
    expect(lines[0]).toEqual({ text: `${glyph} Çapak oranı sonucu`, bold: true, tone });
  });

  it("leaves the title unmarked when verdict is pending", () => {
    const lines = renderResultVerdictToA3({ verdict: "pending", notes: "" }, ENTRY).lines;
    expect(lines[0]).toEqual({ text: "Çapak oranı sonucu", bold: true });
  });

  it("uses Turkish field labels when the entry's language is tr", () => {
    const trEntry: A3EntrySummary = { ...ENTRY, language: "tr" };
    const lines = renderResultVerdictToA3({ verdict: "met", notes: "" }, trEntry).lines;

    expect(lines).toEqual([
      { text: "■ Çapak oranı sonucu", bold: true, tone: "positive" },
      { text: "Sonuç: met" },
    ]);
  });
});
