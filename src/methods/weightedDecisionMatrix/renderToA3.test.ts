import { describe, expect, it } from "vitest";
import type { A3EntrySummary } from "../../a3/methodContract";
import { renderWeightedDecisionMatrixToA3 } from "./renderToA3";

const ENTRY: A3EntrySummary = { id: "e1", title: "Pugh matrix" };

describe("renderWeightedDecisionMatrixToA3", () => {
  it("summarises criteria with their weights, then ranks the options", () => {
    const lines = renderWeightedDecisionMatrixToA3(
      {
        criteria: [
          { id: "c1", name: "Cost", weight: "5" },
          { id: "c2", name: "Speed", weight: "2" },
        ],
        options: [
          { id: "o1", name: "Option A", scores: { c1: "1" } },
          { id: "o2", name: "Option B", scores: { c1: "9", c2: "3" } },
        ],
      },
      ENTRY,
    ).lines;

    expect(lines).toEqual([
      { text: "Pugh matrix", bold: true },
      { text: "Criteria: Cost (5) · Speed (2)" },
      { text: "Option B — 51" },
      { text: "Option A — 5" },
    ]);
  });

  it("omits the criteria line when none is named", () => {
    expect(renderWeightedDecisionMatrixToA3({ criteria: [], options: [] }, ENTRY).lines).toEqual([
      { text: "Pugh matrix", bold: true },
    ]);
  });

  it("drops unnamed options", () => {
    const lines = renderWeightedDecisionMatrixToA3(
      { criteria: [{ id: "c1", name: "Cost", weight: "5" }], options: [{ id: "o1", name: "  ", scores: { c1: "5" } }] },
      ENTRY,
    ).lines;
    expect(lines.slice(1)).toEqual([{ text: "Criteria: Cost (5)" }]);
  });

  /** D-188/P-26: `entry.language` picks the "Criteria"/"Kriterler" prefix. */
  it("uses the Turkish criteria prefix when the entry's language is tr", () => {
    const trEntry: A3EntrySummary = { ...ENTRY, language: "tr" };
    const lines = renderWeightedDecisionMatrixToA3(
      { criteria: [{ id: "c1", name: "Maliyet", weight: "5" }], options: [] },
      trEntry,
    ).lines;

    expect(lines[1]).toEqual({ text: "Kriterler: Maliyet (5)" });
  });
});
