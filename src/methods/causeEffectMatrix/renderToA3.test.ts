import { describe, expect, it } from "vitest";
import type { A3EntrySummary } from "../../a3/methodContract";
import { renderCauseEffectMatrixToA3 } from "./renderToA3";

const ENTRY: A3EntrySummary = { id: "e1", title: "X-Y matrix" };

describe("renderCauseEffectMatrixToA3", () => {
  it("summarises the outputs with their weights, then ranks the inputs", () => {
    const lines = renderCauseEffectMatrixToA3(
      {
        outputs: [
          { id: "o1", name: "Scrap", weight: "9" },
          { id: "o2", name: "Downtime", weight: "3" },
        ],
        inputs: [
          { id: "i1", name: "Melt temp", scores: { o1: "1" } },
          { id: "i2", name: "Cycle time", scores: { o1: "9", o2: "3" } },
        ],
      },
      ENTRY,
    ).lines;

    expect(lines).toEqual([
      { text: "X-Y matrix", bold: true },
      { text: "Outputs: Scrap (9) · Downtime (3)" },
      { text: "Cycle time — 90" },
      { text: "Melt temp — 9" },
    ]);
  });

  it("omits the outputs line when no output has been named", () => {
    const lines = renderCauseEffectMatrixToA3({ outputs: [], inputs: [] }, ENTRY).lines;

    expect(lines).toEqual([{ text: "X-Y matrix", bold: true }]);
  });

  it("drops unnamed inputs rather than exporting a bare score", () => {
    const lines = renderCauseEffectMatrixToA3(
      {
        outputs: [{ id: "o1", name: "Scrap", weight: "9" }],
        inputs: [{ id: "i1", name: "  ", scores: { o1: "5" } }],
      },
      ENTRY,
    ).lines;

    expect(lines.slice(1)).toEqual([{ text: "Outputs: Scrap (9)" }]);
  });

  it("names an output with no weight without inventing one", () => {
    const lines = renderCauseEffectMatrixToA3(
      { outputs: [{ id: "o1", name: "Scrap", weight: "" }], inputs: [] },
      ENTRY,
    ).lines;

    expect(lines[1]).toEqual({ text: "Outputs: Scrap" });
  });
});
