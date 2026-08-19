import { describe, expect, it } from "vitest";
import { renderOpenItemsNextProblemToA3 } from "./renderToA3";

describe("renderOpenItemsNextProblemToA3", () => {
  it("renders one line per non-blank item row, after the bold title", () => {
    const content = renderOpenItemsNextProblemToA3(
      {
        rows: [{ id: "1", description: "Cavity 3 not yet retooled", owner: "Tooling", targetDate: "2026-09-01", status: "open" }],
      },
      { id: "e1", title: "Open items" },
    );

    expect(content.lines).toEqual([
      { text: "Open items", bold: true },
      { text: "▲ Cavity 3 not yet retooled · Tooling · 2026-09-01 · open", tone: "negative" },
    ]);
  });

  it("renders only the title line when there are no rows", () => {
    expect(renderOpenItemsNextProblemToA3({ rows: [] }, { id: "e1", title: "Open items" }).lines).toEqual([
      { text: "Open items", bold: true },
    ]);
  });

  /** P-37: two shapes only, since `status` is genuinely two-valued. */
  it.each([
    ["closed", "■", "positive"],
    ["open", "▲", "negative"],
  ] as const)("marks row status %s with glyph %s and tone %s", (status, glyph, tone) => {
    const content = renderOpenItemsNextProblemToA3(
      { rows: [{ id: "1", description: "Cavity 3 retool", owner: "", targetDate: "", status }] },
      { id: "e1", title: "Open items" },
    );

    expect(content.lines[1]).toEqual({ text: `${glyph} Cavity 3 retool · ${status}`, tone });
  });

  it("leaves a row with an unrecognized status unmarked", () => {
    const content = renderOpenItemsNextProblemToA3(
      { rows: [{ id: "1", description: "Cavity 3 retool", owner: "", targetDate: "", status: "deferred" }] },
      { id: "e1", title: "Open items" },
    );

    expect(content.lines[1]).toEqual({ text: "Cavity 3 retool · deferred" });
  });
});
