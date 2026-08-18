import { describe, expect, it } from "vitest";
import type { A3EntrySummary } from "../../a3/methodContract";
import { renderSideEffectRiskAssessmentToA3 } from "./renderToA3";

const ENTRY: A3EntrySummary = { id: "e1", title: "Risk of the poka-yoke jig" };

describe("renderSideEffectRiskAssessmentToA3", () => {
  it("exports the populated fields as label: value lines", () => {
    const lines = renderSideEffectRiskAssessmentToA3(
      { description: "Jig may jam on oversized parts", severity: "medium", mitigation: "Add clearance sensor" },
      ENTRY,
    ).lines;

    expect(lines).toEqual([
      { text: "Risk of the poka-yoke jig", bold: true },
      { text: "Side effect / risk: Jig may jam on oversized parts" },
      { text: "Severity: medium" },
      { text: "Mitigation: Add clearance sensor" },
    ]);
  });

  it("drops blank fields", () => {
    const lines = renderSideEffectRiskAssessmentToA3({ description: "", severity: "", mitigation: "" }, ENTRY).lines;
    expect(lines).toEqual([{ text: "Risk of the poka-yoke jig", bold: true }]);
  });

  /** D-188/P-26: `entry.language` picks the export label variant. */
  it("uses Turkish field labels when the entry's language is tr", () => {
    const trEntry: A3EntrySummary = { ...ENTRY, language: "tr" };
    const lines = renderSideEffectRiskAssessmentToA3(
      { description: "Kalıp aşırı parçada sıkışabilir", severity: "", mitigation: "" },
      trEntry,
    ).lines;

    expect(lines).toEqual([
      { text: "Risk of the poka-yoke jig", bold: true },
      { text: "Yan etki / risk: Kalıp aşırı parçada sıkışabilir" },
    ]);
  });
});
