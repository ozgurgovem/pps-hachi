import { describe, expect, it } from "vitest";
import type { A3EntrySummary } from "../../a3/methodContract";
import { renderSustainPlanToA3 } from "./renderToA3";

const ENTRY: A3EntrySummary = { id: "e1", title: "Cavity 2 flash sustainment" };

describe("renderSustainPlanToA3", () => {
  it("exports the populated fields as label: value lines", () => {
    const lines = renderSustainPlanToA3(
      { auditType: "LPA", frequency: "Weekly", owner: "Line lead", lpaLinkage: "LPA-2026-014" },
      ENTRY,
    ).lines;

    expect(lines).toEqual([
      { text: "Cavity 2 flash sustainment", bold: true },
      { text: "Audit type: LPA" },
      { text: "Frequency: Weekly" },
      { text: "Owner: Line lead" },
      { text: "LPA linkage: LPA-2026-014" },
    ]);
  });

  it("drops blank fields", () => {
    const lines = renderSustainPlanToA3({ auditType: "", frequency: "", owner: "", lpaLinkage: "" }, ENTRY).lines;
    expect(lines).toEqual([{ text: "Cavity 2 flash sustainment", bold: true }]);
  });

  it("uses Turkish field labels when the entry's language is tr", () => {
    const trEntry: A3EntrySummary = { ...ENTRY, language: "tr" };
    const lines = renderSustainPlanToA3({ auditType: "LPA", frequency: "", owner: "", lpaLinkage: "" }, trEntry).lines;

    expect(lines).toEqual([
      { text: "Cavity 2 flash sustainment", bold: true },
      { text: "Denetim tipi: LPA" },
    ]);
  });
});
