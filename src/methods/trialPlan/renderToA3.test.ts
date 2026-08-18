import { describe, expect, it } from "vitest";
import type { A3EntrySummary } from "../../a3/methodContract";
import { renderTrialPlanToA3 } from "./renderToA3";

const ENTRY: A3EntrySummary = { id: "e1", title: "Line 3 trial" };

describe("renderTrialPlanToA3", () => {
  it("exports the populated fields as label: value lines", () => {
    const lines = renderTrialPlanToA3(
      { scope: "Cavity 2 only", duration: "2 weeks", sampleSize: "500 pcs", acceptanceCriteria: "0 defects" },
      ENTRY,
    ).lines;

    expect(lines).toEqual([
      { text: "Line 3 trial", bold: true },
      { text: "Scope: Cavity 2 only" },
      { text: "Duration: 2 weeks" },
      { text: "Sample size: 500 pcs" },
      { text: "Acceptance criteria: 0 defects" },
    ]);
  });

  it("drops blank fields", () => {
    const lines = renderTrialPlanToA3({ scope: "", duration: "", sampleSize: "", acceptanceCriteria: "" }, ENTRY).lines;
    expect(lines).toEqual([{ text: "Line 3 trial", bold: true }]);
  });

  /** D-188/P-26: `entry.language` picks the export label variant. */
  it("uses Turkish field labels when the entry's language is tr", () => {
    const trEntry: A3EntrySummary = { ...ENTRY, language: "tr" };
    const lines = renderTrialPlanToA3(
      { scope: "Sadece kavite 2", duration: "", sampleSize: "", acceptanceCriteria: "" },
      trEntry,
    ).lines;

    expect(lines).toEqual([
      { text: "Line 3 trial", bold: true },
      { text: "Kapsam: Sadece kavite 2" },
    ]);
  });
});
