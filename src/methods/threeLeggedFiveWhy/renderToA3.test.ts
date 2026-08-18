import { describe, expect, it } from "vitest";
import { renderThreeLeggedFiveWhyToA3 } from "./renderToA3";
import type { ThreeLeggedFiveWhyPayload } from "./schema";

describe("renderThreeLeggedFiveWhyToA3", () => {
  it("renders each non-empty leg under its own bold label, in Occurrence/Detection/Systemic order", () => {
    const payload: ThreeLeggedFiveWhyPayload = {
      problemStatement: "Müşteri şikayeti: gürültü.",
      occurrence: [{ id: "o1", answer: "Panel titreşiyor" }],
      detection: [],
      systemic: [{ id: "s1", answer: "Kontrol planı güncellenmemiş" }],
    };

    const content = renderThreeLeggedFiveWhyToA3(payload, { id: "e1", title: "3 Bacaklı 5 Neden" });

    expect(content.lines).toEqual([
      { text: "3 Bacaklı 5 Neden", bold: true },
      { text: "Müşteri şikayeti: gürültü." },
      { text: "Occurrence", bold: true },
      { text: "Why 1: Panel titreşiyor" },
      { text: "Systemic", bold: true },
      { text: "Why 1: Kontrol planı güncellenmemiş" },
    ]);
  });

  it("renders only the title when every leg is empty", () => {
    const content = renderThreeLeggedFiveWhyToA3(
      { problemStatement: "", occurrence: [], detection: [], systemic: [] },
      { id: "e1", title: "3 Bacaklı 5 Neden" },
    );
    expect(content.lines).toEqual([{ text: "3 Bacaklı 5 Neden", bold: true }]);
  });

  /** D-188/P-26: `entry.language` picks both the leg headings and the "Why"/"Neden" chain label. */
  it("uses Turkish leg headings and chain labels when the entry's language is tr", () => {
    const payload: ThreeLeggedFiveWhyPayload = {
      problemStatement: "",
      occurrence: [{ id: "o1", answer: "Panel titreşiyor" }],
      detection: [],
      systemic: [],
    };

    const content = renderThreeLeggedFiveWhyToA3(payload, { id: "e1", title: "3 Bacaklı 5 Neden", language: "tr" });

    expect(content.lines).toEqual([
      { text: "3 Bacaklı 5 Neden", bold: true },
      { text: "Oluşum", bold: true },
      { text: "Neden 1: Panel titreşiyor" },
    ]);
  });
});
