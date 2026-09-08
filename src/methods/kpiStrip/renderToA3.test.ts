import { describe, expect, it } from "vitest";
import type { KpiStripChartSpec } from "../chartSpec";
import { renderKpiStripToA3 } from "./renderToA3";
import type { KpiStripPayload } from "./schema";

const ENTRY = { id: "e1", title: "ADIM 7 KPI izleme" };

function emptyPayload(): KpiStripPayload {
  return { items: [] };
}

describe("renderKpiStripToA3", () => {
  /**
   * P-63: `lines` used to carry the bold entry title (1 row) on top of the
   * chart's own `rowSpan` (6) — 7 rows total against `pps-8step-auto`'s
   * exactly-6-row ADIM 7 canvas, so every entry unconditionally overflowed
   * to an appendix. The title now travels inside the chart's own spec
   * (`KpiStripChart`'s header band) instead, so `lines` stays empty and the
   * block's total row request drops to exactly 6.
   */
  it("carries the entry title through the chart spec, keeps lines empty, and requests the kpi-strip image kind", () => {
    const content = renderKpiStripToA3(emptyPayload(), ENTRY);

    expect(content.lines).toEqual([]);
    expect(content.image?.kind).toBe("kpi-strip");
    expect(content.image?.rowSpan).toBe(6);
    const spec = content.image?.spec as KpiStripChartSpec;
    expect(spec.title).toBe("ADIM 7 KPI izleme");
  });

  it("builds a KpiStripChartSpec item per KPI, carrying status straight through unchanged", () => {
    const payload: KpiStripPayload = {
      items: [
        {
          id: "i1",
          label: "Çapak Fire Oranı",
          unit: "%",
          baseline: 4.2,
          target: 1.0,
          actual: 2.1,
          sustain: undefined,
          result: undefined,
          status: "inProgress",
        },
        {
          id: "i2",
          label: "Kalıp Duruş Süresi",
          unit: "dk",
          baseline: 45,
          target: 20,
          actual: 18,
          sustain: 19,
          result: 18,
          status: "onTarget",
        },
      ],
    };

    const content = renderKpiStripToA3(payload, ENTRY);
    const spec = content.image?.spec as KpiStripChartSpec;

    expect(spec.kind).toBe("kpi-strip");
    expect(spec.items).toEqual([
      { label: "Çapak Fire Oranı", unit: "%", baseline: 4.2, target: 1.0, actual: 2.1, sustain: undefined, result: undefined, status: "inProgress" },
      { label: "Kalıp Duruş Süresi", unit: "dk", baseline: 45, target: 20, actual: 18, sustain: 19, result: 18, status: "onTarget" },
    ]);
  });

  /** D-188/P-26: the chart's footer legend (sustain/result) previously hardcoded Turkish text regardless of `entry.language`. */
  it("resolves the sustain/result footer legend by entry.language, defaulting to English", () => {
    const englishContent = renderKpiStripToA3(emptyPayload(), ENTRY);
    const englishSpec = englishContent.image?.spec as KpiStripChartSpec;
    expect(englishSpec.sustainLabel).toBe("Sustain");
    expect(englishSpec.resultLabel).toBe("Result");

    const trContent = renderKpiStripToA3(emptyPayload(), { ...ENTRY, language: "tr" });
    const trSpec = trContent.image?.spec as KpiStripChartSpec;
    expect(trSpec.sustainLabel).toBe("Sürdürme");
    expect(trSpec.resultLabel).toBe("Sonuç");
  });

  it("turns a blank unit into undefined, matching pareto/problemImpact's own convention", () => {
    const payload: KpiStripPayload = {
      items: [
        {
          id: "i1",
          label: "Fire Maliyeti",
          unit: "",
          baseline: 38000,
          target: 15000,
          actual: 30000,
          sustain: undefined,
          result: undefined,
          status: "behind",
        },
      ],
    };

    const content = renderKpiStripToA3(payload, ENTRY);
    const spec = content.image?.spec as KpiStripChartSpec;

    expect(spec.items[0]?.unit).toBeUndefined();
  });
});
