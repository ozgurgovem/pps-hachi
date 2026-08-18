import { describe, expect, it } from "vitest";
import { renderFiveWhyToA3 } from "./renderToA3";
import type { FiveWhyPayload } from "./schema";

describe("renderFiveWhyToA3", () => {
  it("renders the title, the problem statement, then each numbered why", () => {
    const payload: FiveWhyPayload = {
      problemStatement: "Kapı paneli gürültü yapıyor.",
      whys: [
        { id: "w1", answer: "Panel titreşiyor" },
        { id: "w2", answer: "Klips gevşemiş" },
      ],
    };

    const content = renderFiveWhyToA3(payload, { id: "e1", title: "5 Neden" });

    expect(content.lines).toEqual([
      { text: "5 Neden", bold: true },
      { text: "Kapı paneli gürültü yapıyor." },
      { text: "Why 1: Panel titreşiyor" },
      { text: "Why 2: Klips gevşemiş" },
    ]);
  });

  it("omits the problem statement line when it's blank", () => {
    const content = renderFiveWhyToA3({ problemStatement: "", whys: [] }, { id: "e1", title: "5 Neden" });
    expect(content.lines).toEqual([{ text: "5 Neden", bold: true }]);
  });

  /** D-188/P-26: `entry.language` picks the "Why"/"Neden" chain label. */
  it("uses the Turkish chain label when the entry's language is tr", () => {
    const payload: FiveWhyPayload = { problemStatement: "", whys: [{ id: "w1", answer: "Panel titreşiyor" }] };
    const content = renderFiveWhyToA3(payload, { id: "e1", title: "5 Neden", language: "tr" });

    expect(content.lines).toEqual([
      { text: "5 Neden", bold: true },
      { text: "Neden 1: Panel titreşiyor" },
    ]);
  });
});
