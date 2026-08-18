import { describe, expect, it } from "vitest";
import type { ParetoChartSpec } from "../chartSpec";
import { renderProblemImpactToA3 } from "./renderToA3";
import type { ProblemImpactPayload } from "./schema";

const ENTRY = { id: "e1", title: "Kapı paneli fire maliyeti" };

function emptyPayload(): ProblemImpactPayload {
  return { unit: "", categories: [], monthlyLoss: "", yearlyLoss: "", currencyUnit: "", calculationNote: "" };
}

describe("renderProblemImpactToA3", () => {
  it("puts the bold title first, then the populated loss fields as label: value lines", () => {
    const payload: ProblemImpactPayload = {
      ...emptyPayload(),
      monthlyLoss: "€4,200",
      yearlyLoss: "€50,400",
      currencyUnit: "EUR",
      calculationNote: "Hat 3 duruş süresine göre hesaplandı.",
    };

    const content = renderProblemImpactToA3(payload, ENTRY);

    expect(content.lines).toEqual([
      { text: "Kapı paneli fire maliyeti", bold: true },
      { text: "Monthly loss: €4,200" },
      { text: "Yearly loss: €50,400" },
      { text: "Currency/unit: EUR" },
      { text: "Calculation note: Hat 3 duruş süresine göre hesaplandı." },
    ]);
  });

  it("drops blank loss fields, leaving only the title line", () => {
    const content = renderProblemImpactToA3(emptyPayload(), ENTRY);
    expect(content.lines).toEqual([{ text: "Kapı paneli fire maliyeti", bold: true }]);
  });

  /** D-188/P-26: `entry.language` picks the export label variant. */
  it("uses Turkish field labels when the entry's language is tr", () => {
    const trEntry = { ...ENTRY, language: "tr" as const };
    const payload: ProblemImpactPayload = { ...emptyPayload(), monthlyLoss: "€4,200" };

    const content = renderProblemImpactToA3(payload, trEntry);

    expect(content.lines).toEqual([
      { text: "Kapı paneli fire maliyeti", bold: true },
      { text: "Aylık kayıp: €4,200" },
    ]);
  });

  it("requests the shared pareto-chart image kind, built from its own categories/unit", () => {
    const payload: ProblemImpactPayload = {
      ...emptyPayload(),
      unit: "adet",
      categories: [
        { id: "c1", label: "Sızdırmazlık", count: 12 },
        { id: "c2", label: "Boya hatası", count: 30 },
      ],
    };

    const content = renderProblemImpactToA3(payload, ENTRY);

    expect(content.image?.kind).toBe("pareto-chart");
    expect(content.image?.rowSpan).toBe(10);

    const spec = content.image?.spec as ParetoChartSpec;
    expect(spec.kind).toBe("pareto");
    expect(spec.unit).toBe("adet");
    expect(spec.items).toEqual([
      { label: "Sızdırmazlık", count: 12 },
      { label: "Boya hatası", count: 30 },
    ]);
  });
});
