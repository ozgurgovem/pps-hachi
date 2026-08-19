import { describe, expect, it } from "vitest";
import type { A3EntrySummary } from "../../a3/methodContract";
import { renderStatisticalConfirmationToA3 } from "./renderToA3";

const ENTRY: A3EntrySummary = { id: "e1", title: "Post-fix capability study" };

describe("renderStatisticalConfirmationToA3", () => {
  it("exports the populated fields as label: value lines", () => {
    const lines = renderStatisticalConfirmationToA3(
      { cp: "1.42", cpk: "1.31", pChartSummary: "In control, 4 weeks", defectRate: "0.3%" },
      ENTRY,
    ).lines;

    expect(lines).toEqual([
      { text: "Post-fix capability study", bold: true },
      { text: "Cp: 1.42" },
      { text: "Cpk: 1.31" },
      { text: "p-chart summary: In control, 4 weeks" },
      { text: "Defect rate: 0.3%" },
    ]);
  });

  it("drops blank fields", () => {
    const lines = renderStatisticalConfirmationToA3({ cp: "", cpk: "", pChartSummary: "", defectRate: "" }, ENTRY).lines;
    expect(lines).toEqual([{ text: "Post-fix capability study", bold: true }]);
  });

  it("uses Turkish field labels when the entry's language is tr", () => {
    const trEntry: A3EntrySummary = { ...ENTRY, language: "tr" };
    const lines = renderStatisticalConfirmationToA3(
      { cp: "1.42", cpk: "", pChartSummary: "", defectRate: "" },
      trEntry,
    ).lines;

    expect(lines).toEqual([
      { text: "Post-fix capability study", bold: true },
      { text: "Cp: 1.42" },
    ]);
  });
});
