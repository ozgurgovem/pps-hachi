import { describe, expect, it } from "vitest";
import type { TrendChartSpec } from "../chartSpec";
import { renderTrendToA3 } from "./renderToA3";
import type { TrendPayload } from "./schema";

describe("renderTrendToA3", () => {
  it("carries the entry title as a bold line and the series as a trend chart spec", () => {
    const payload: TrendPayload = {
      unit: "PPM",
      points: [
        { id: "p1", label: "Hafta 1", value: 120 },
        { id: "p2", label: "Hafta 2", value: 80 },
      ],
      targetValue: 20,
      targetLabel: "Hedef",
      events: [{ label: "Kalıp değişti", at: "Hafta 2" }],
    };

    const content = renderTrendToA3(payload, { id: "entry-1", title: "Hat 3 Trend" });

    expect(content.lines).toEqual([{ text: "Hat 3 Trend", bold: true }]);
    expect(content.image?.kind).toBe("trend-chart");

    const spec = content.image?.spec as TrendChartSpec;
    expect(spec.kind).toBe("trend");
    expect(spec.points).toEqual([
      { label: "Hafta 1", value: 120 },
      { label: "Hafta 2", value: 80 },
    ]);
    expect(spec.targetValue).toBe(20);
    expect(spec.events).toEqual([{ label: "Kalıp değişti", at: "Hafta 2" }]);
  });
});
