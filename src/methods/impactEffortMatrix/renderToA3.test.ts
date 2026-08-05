import { describe, expect, it } from "vitest";
import type { A3EntrySummary } from "../../a3/methodContract";
import { renderImpactEffortMatrixToA3 } from "./renderToA3";

const ENTRY: A3EntrySummary = { id: "e1", title: "Impact/effort matrix" };

describe("renderImpactEffortMatrixToA3", () => {
  it("appends the computed quadrant label to each named item", () => {
    const lines = renderImpactEffortMatrixToA3(
      { items: [{ id: "1", description: "Automate weld check", impact: "5", effort: "1" }] },
      ENTRY,
    ).lines;

    expect(lines).toEqual([
      { text: "Impact/effort matrix", bold: true },
      { text: "Automate weld check — Quick win" },
    ]);
  });

  it("exports an unscored item's description alone, without inventing a quadrant", () => {
    const lines = renderImpactEffortMatrixToA3(
      { items: [{ id: "1", description: "Undecided item", impact: "", effort: "" }] },
      ENTRY,
    ).lines;

    expect(lines[1]).toEqual({ text: "Undecided item" });
  });

  it("drops unnamed items", () => {
    const lines = renderImpactEffortMatrixToA3(
      { items: [{ id: "1", description: "  ", impact: "5", effort: "1" }] },
      ENTRY,
    ).lines;

    expect(lines).toEqual([{ text: "Impact/effort matrix", bold: true }]);
  });
});
