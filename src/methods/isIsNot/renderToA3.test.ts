import { describe, expect, it } from "vitest";
import { renderIsIsNotToA3 } from "./renderToA3";
import type { IsIsNotPayload } from "./schema";

function emptyPayload(): IsIsNotPayload {
  return {
    whatIs: "",
    whatIsNot: "",
    whereIs: "",
    whereIsNot: "",
    whenIs: "",
    whenIsNot: "",
    extentIs: "",
    extentIsNot: "",
  };
}

describe("renderIsIsNotToA3", () => {
  it("renders only dimensions with at least one filled column, after the bold title", () => {
    const payload: IsIsNotPayload = { ...emptyPayload(), whatIs: "Gürültü", whatIsNot: "Titreşim" };
    const content = renderIsIsNotToA3(payload, { id: "e1", title: "Is/Is-Not" });

    expect(content.lines).toEqual([
      { text: "Is/Is-Not", bold: true },
      { text: "What — Is: Gürültü · Is Not: Titreşim" },
    ]);
  });

  it("renders only the title line when every dimension is blank", () => {
    const content = renderIsIsNotToA3(emptyPayload(), { id: "e1", title: "Is/Is-Not" });
    expect(content.lines).toEqual([{ text: "Is/Is-Not", bold: true }]);
  });
});
