import { describe, expect, it } from "vitest";
import type { KpiStripChartSpec } from "../chartSpec";
import { renderKpiStripToA3 } from "./renderToA3";
import type { KpiStripPayload } from "./schema";

const ENTRY = { id: "e1", title: "ADIM 7 KPI izleme" };

function emptyPayload(): KpiStripPayload {
  return { items: [] };
}

describe("renderKpiStripToA3", () => {
  it("puts the bold entry title as the only line, and requests the kpi-strip image kind", () => {
    const content = renderKpiStripToA3(emptyPayload(), ENTRY);

    expect(content.lines).toEqual([{ text: "ADIM 7 KPI izleme", bold: true }]);
    expect(content.image?.kind).toBe("kpi-strip");
    expect(content.image?.rowSpan).toBe(6);
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
