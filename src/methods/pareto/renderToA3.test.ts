import { describe, expect, it } from "vitest";
import type { ParetoChartSpec } from "../chartSpec";
import { renderParetoToA3 } from "./renderToA3";
import type { ParetoPayload } from "./schema";

describe("renderParetoToA3", () => {
  it("carries the entry title as a bold line and the categories as a pareto chart spec", () => {
    const payload: ParetoPayload = {
      unit: "adet",
      categories: [
        { id: "c1", label: "Sızdırmazlık", count: 12 },
        { id: "c2", label: "Boya hatası", count: 30 },
      ],
    };

    const content = renderParetoToA3(payload, { id: "entry-1", title: "Hat 3 Pareto" });

    expect(content.lines).toEqual([{ text: "Hat 3 Pareto", bold: true }]);
    expect(content.image?.kind).toBe("pareto-chart");
    expect(content.image?.rowSpan).toBeGreaterThan(0);

    const spec = content.image?.spec as ParetoChartSpec;
    expect(spec.kind).toBe("pareto");
    expect(spec.unit).toBe("adet");
    expect(spec.items).toEqual([
      { label: "Sızdırmazlık", count: 12 },
      { label: "Boya hatası", count: 30 },
    ]);
  });

  it("emits no zones — Pareto uses the vertical-stack image path, not the horizontal strip", () => {
    const content = renderParetoToA3({ unit: "", categories: [] }, { id: "e", title: "t" });
    expect(content.zones).toBeUndefined();
  });
});
