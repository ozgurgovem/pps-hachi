import { describe, expect, it } from "vitest";
import { renderFiveG5N1KToA3 } from "./renderToA3";
import type { FiveG5N1KPayload } from "./schema";

function emptyPayload(): FiveG5N1KPayload {
  return {
    gemba: "",
    gembutsu: "",
    genjitsu: "",
    genri: "",
    gensoku: "",
    ne: "",
    nerede: "",
    nasil: "",
    neZaman: "",
    neKadar: "",
    kim: "",
  };
}

describe("renderFiveG5N1KToA3", () => {
  it("renders only the non-blank fields as labeled lines, after the bold title", () => {
    const payload: FiveG5N1KPayload = { ...emptyPayload(), gemba: "Hat 3", kim: "Ayşe Yılmaz" };
    const content = renderFiveG5N1KToA3(payload, { id: "e1", title: "Problem Tanımı", language: "tr" });

    expect(content.lines).toEqual([
      { text: "Problem Tanımı", bold: true },
      { text: "Gemba: Hat 3" },
      { text: "Kim: Ayşe Yılmaz" },
    ]);
  });

  it("renders only the title line when every field is blank", () => {
    const content = renderFiveG5N1KToA3(emptyPayload(), { id: "e1", title: "Problem Tanımı" });
    expect(content.lines).toEqual([{ text: "Problem Tanımı", bold: true }]);
  });

  /**
   * D-188/P-26: previously the 5N1K question words were hardcoded Turkish
   * regardless of `entry.language` (the bidirectional half of the bug) — the
   * 5G romanized terms stay identical in both languages.
   */
  it("uses English question words for an English-language entry", () => {
    const payload: FiveG5N1KPayload = { ...emptyPayload(), gemba: "Line 3", ne: "Weld defect" };
    const content = renderFiveG5N1KToA3(payload, { id: "e1", title: "Problem Tanımı", language: "en" });

    expect(content.lines).toEqual([
      { text: "Problem Tanımı", bold: true },
      { text: "Gemba: Line 3" },
      { text: "What: Weld defect" },
    ]);
  });
});
