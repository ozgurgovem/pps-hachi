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
    const content = renderFiveG5N1KToA3(payload, { id: "e1", title: "Problem Tanımı" });

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
});
