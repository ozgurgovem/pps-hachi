import { describe, expect, it } from "vitest";
import type { GapAnalysisChartSpec } from "../chartSpec";
import { renderGapStatementToA3 } from "./renderToA3";
import type { GapStatementPayload } from "./schema";

function emptyPayload(): GapStatementPayload {
  return {
    ideal: "",
    actual: "",
    gap: "",
    gapValue: 0,
    unit: "",
    baselinePeriod: "",
    idealValue: 0,
    actualValue: 0,
    targetDate: "",
  };
}

/**
 * ADIM 1 BVVL round (2026-09-16/17): replaces D-224's `zones` panel — a
 * single `gap-analysis-chart` image (chart + the three Layer A bands
 * together) instead of two duplicated text zones.
 */
describe("renderGapStatementToA3 (BVVL round, gap-analysis-chart)", () => {
  it("emits no top-level lines and exactly one image request", () => {
    const content = renderGapStatementToA3(emptyPayload(), { id: "e1", title: "Leak at final test" });

    expect(content.lines).toEqual([]);
    expect(content.zones).toBeUndefined();
    expect(content.image).toBeDefined();
    expect(content.image!.kind).toBe("gap-analysis-chart");
  });

  it("declares a fixed row span for the combined chart+bands image", () => {
    const content = renderGapStatementToA3(emptyPayload(), { id: "e1", title: "Leak at final test" });
    expect(content.image!.rowSpan).toBe(8);
  });

  it("forwards the ideal/actual numeric values and unit straight into the spec", () => {
    const payload: GapStatementPayload = { ...emptyPayload(), idealValue: 3, actualValue: 16.4, unit: "%" };
    const content = renderGapStatementToA3(payload, { id: "e1", title: "Leak at final test" });
    const spec = content.image!.spec as GapAnalysisChartSpec;

    expect(spec.idealValue).toBe(3);
    expect(spec.actualValue).toBe(16.4);
    expect(spec.unit).toBe("%");
  });

  it("uses baselinePeriod as the actual bar's date and targetDate as the ideal bar's date", () => {
    const payload: GapStatementPayload = { ...emptyPayload(), baselinePeriod: "01.08.2026", targetDate: "04.10.2026" };
    const content = renderGapStatementToA3(payload, { id: "e1", title: "Leak at final test" });
    const spec = content.image!.spec as GapAnalysisChartSpec;

    expect(spec.actualDate).toBe("01.08.2026");
    expect(spec.idealDate).toBe("04.10.2026");
  });

  it("builds the three Layer A band texts from ideal/actual/gap, with an em-dash placeholder when blank", () => {
    const content = renderGapStatementToA3(emptyPayload(), { id: "e1", title: "Leak at final test" });
    const spec = content.image!.spec as GapAnalysisChartSpec;

    expect(spec.bandTexts).toEqual(["Ideal State: —", "Current State: —", "Problem Statement: —"]);
  });

  it("fills the band texts with real values when the fields are set", () => {
    const payload: GapStatementPayload = {
      ...emptyPayload(),
      ideal: "Zero leaks",
      actual: "Intermittent leak",
      gap: "3 PPM above ideal",
    };
    const content = renderGapStatementToA3(payload, { id: "e1", title: "Leak at final test" });
    const spec = content.image!.spec as GapAnalysisChartSpec;

    expect(spec.bandTexts).toEqual([
      "Ideal State: Zero leaks",
      "Current State: Intermittent leak",
      "Problem Statement: 3 PPM above ideal",
    ]);
  });

  /** D-188/P-26: `entry.language` picks Turkish labels/title throughout — the same rule D-43 already applies everywhere else. */
  it("uses Turkish labels and chart title when the entry's language is tr", () => {
    const payload: GapStatementPayload = { ...emptyPayload(), ideal: "Sıfır kaçak" };
    const content = renderGapStatementToA3(payload, { id: "e1", title: "Son test kaçağı", language: "tr" });
    const spec = content.image!.spec as GapAnalysisChartSpec;

    expect(spec.title).toBe("GAP ANALİZİ");
    expect(spec.idealBarLabel).toBe("İdeal Durum");
    expect(spec.actualBarLabel).toBe("Mevcut Durum");
    expect(spec.deviationLabel).toBe("Hedeften Sapma");
    expect(spec.bandTexts[0]).toBe("İdeal Durum: Sıfır kaçak");
  });

  it("defaults to English when the entry carries no language", () => {
    const content = renderGapStatementToA3(emptyPayload(), { id: "e1", title: "Leak at final test" });
    const spec = content.image!.spec as GapAnalysisChartSpec;
    expect(spec.title).toBe("GAP ANALYSIS");
  });
});
