import { describe, expect, it } from "vitest";
import { renderFiveW2HToA3 } from "./renderToA3";
import type { FiveW2HPayload } from "./schema";

function emptyPayload(): FiveW2HPayload {
  return { what: "", where: "", when: "", who: "", which: "", how: "", howMuch: "" };
}

describe("renderFiveW2HToA3", () => {
  it("renders only the non-blank fields as labeled lines, after the bold title", () => {
    const payload: FiveW2HPayload = { ...emptyPayload(), what: "Noise", who: "Ayşe Yılmaz" };
    const content = renderFiveW2HToA3(payload, { id: "e1", title: "Problem statement" });

    expect(content.lines).toEqual([
      { text: "Problem statement", bold: true },
      { text: "What: Noise" },
      { text: "Who: Ayşe Yılmaz" },
    ]);
  });

  it("renders only the title line when every field is blank", () => {
    const content = renderFiveW2HToA3(emptyPayload(), { id: "e1", title: "Problem statement" });
    expect(content.lines).toEqual([{ text: "Problem statement", bold: true }]);
  });
});
