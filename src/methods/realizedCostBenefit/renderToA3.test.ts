import { describe, expect, it } from "vitest";
import type { A3EntrySummary } from "../../a3/methodContract";
import { renderRealizedCostBenefitToA3 } from "./renderToA3";

const ENTRY: A3EntrySummary = { id: "e1", title: "Fixture retool payback" };

describe("renderRealizedCostBenefitToA3", () => {
  it("exports the populated fields as label: value lines", () => {
    const lines = renderRealizedCostBenefitToA3(
      { realizedBenefit: "€18,000/yr", actualCost: "€4,200", netBenefit: "€13,800/yr", notes: "Confirmed after 8 weeks" },
      ENTRY,
    ).lines;

    expect(lines).toEqual([
      { text: "Fixture retool payback", bold: true },
      { text: "Realized benefit: €18,000/yr" },
      { text: "Actual cost: €4,200" },
      { text: "Net benefit: €13,800/yr" },
      { text: "Notes: Confirmed after 8 weeks" },
    ]);
  });

  it("drops blank fields", () => {
    const lines = renderRealizedCostBenefitToA3(
      { realizedBenefit: "", actualCost: "", netBenefit: "", notes: "" },
      ENTRY,
    ).lines;
    expect(lines).toEqual([{ text: "Fixture retool payback", bold: true }]);
  });

  it("uses Turkish field labels when the entry's language is tr", () => {
    const trEntry: A3EntrySummary = { ...ENTRY, language: "tr" };
    const lines = renderRealizedCostBenefitToA3(
      { realizedBenefit: "€18.000/yıl", actualCost: "", netBenefit: "", notes: "" },
      trEntry,
    ).lines;

    expect(lines).toEqual([
      { text: "Fixture retool payback", bold: true },
      { text: "Gerçekleşen fayda: €18.000/yıl" },
    ]);
  });
});
