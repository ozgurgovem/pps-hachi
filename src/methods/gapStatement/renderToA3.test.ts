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

  /**
   * Round 7 follow-up (2026-09-17, Barış's own live block preview
   * screenshot): a fixed `rowSpan: 12` stayed pinned to ADIM 1's own
   * STATIC default even once elastic growth (Faz 11/L3a) pushed the real
   * block far past 12 rows, leaving a huge empty area in the live block
   * preview under two now-tiny images. `rowSpan` is left OMITTED so
   * `place.ts` sizes this to the block's own real, post-elastic row
   * range instead — self-bounding by construction (see `renderToA3.ts`'s
   * own note), not the fixed number this used to be.
   */
  it("declares NO fixed row span (grows with the block's own real, post-elastic height) and a widthFraction to share the block's width", () => {
    const content = renderGapStatementToA3(emptyPayload(), { id: "e1", title: "Leak at final test" });
    expect(content.image!.rowSpan).toBeUndefined();
    expect(content.widthFraction).toBe(0.5);
  });

  /**
   * Round 8 follow-up (2026-09-17, Barış's own live block preview
   * screenshot): an omitted `rowSpan` reports Infinite demand to the
   * elastic solver, letting this entry absorb an ENTIRE column's surplus
   * when neighbours are empty — a much larger block than the chart itself
   * needed. `maxDemandRowSpan` bounds the solver's demand while leaving
   * `rowSpan` itself omitted, so placement still self-bounds safely.
   */
  it("caps the elastic solver's demand at a finite maxDemandRowSpan, without reintroducing a fixed rowSpan", () => {
    const content = renderGapStatementToA3(emptyPayload(), { id: "e1", title: "Leak at final test" });
    expect(content.image!.rowSpan).toBeUndefined();
    expect(content.image!.maxDemandRowSpan).toBe(24);
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
