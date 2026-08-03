import { describe, expect, it } from "vitest";
import { renderCheckSheetToA3 } from "./renderToA3";

describe("renderCheckSheetToA3", () => {
  it("renders one line per non-blank tally row, after the bold title", () => {
    const content = renderCheckSheetToA3(
      { rows: [{ id: "1", item: "Scratch", count: "12", date: "2026-08-01", note: "Station 4" }] },
      { id: "e1", title: "Defect tally" },
    );

    expect(content.lines).toEqual([
      { text: "Defect tally", bold: true },
      { text: "Scratch · 12 · 2026-08-01 · Station 4" },
    ]);
  });

  it("renders only the title line when there are no rows", () => {
    const content = renderCheckSheetToA3({ rows: [] }, { id: "e1", title: "Defect tally" });
    expect(content.lines).toEqual([{ text: "Defect tally", bold: true }]);
  });
});
