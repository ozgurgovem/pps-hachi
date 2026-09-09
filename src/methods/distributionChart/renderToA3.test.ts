import { describe, expect, it } from "vitest";
import type { A3EntrySummary } from "../../a3/methodContract";
import { renderDistributionChartToA3 } from "./renderToA3";
import type { DistributionChartPayload } from "./schema";

const ENTRY: A3EntrySummary = { id: "e1", title: "Wall thickness spread" };

function payload(overrides: Partial<DistributionChartPayload>): DistributionChartPayload {
  return { chartType: "histogram", unit: "", binCount: "", samples: [], points: [], ...overrides };
}

describe("renderDistributionChartToA3", () => {
  it("requests a distribution-chart image reserving the same row span as other Step 2 charts", () => {
    const block = renderDistributionChartToA3(payload({}), ENTRY);
    expect(block.lines).toEqual([{ text: "Wall thickness spread", bold: true }]);
    expect(block.image?.kind).toBe("distribution-chart");
    expect(block.image?.rowSpan).toBeGreaterThan(0);
  });

  it("builds a histogram spec from parsed sample values", () => {
    const block = renderDistributionChartToA3(
      payload({ chartType: "histogram", unit: "mm", samples: [{ id: "s1", value: "1" }, { id: "s2", value: "x" }] }),
      ENTRY,
    );
    expect(block.image?.spec).toEqual({ kind: "histogram", unit: "mm", values: [1], binCount: undefined, language: "en" });
  });

  it("builds a scatter spec from parsed points, ignoring the unused samples list", () => {
    const block = renderDistributionChartToA3(
      payload({ chartType: "scatter", points: [{ id: "p1", x: "1", y: "2" }], samples: [{ id: "s1", value: "99" }] }),
      ENTRY,
    );
    expect(block.image?.spec).toEqual({ kind: "scatter", xLabel: undefined, points: [{ x: 1, y: 2 }] });
  });

  it("builds a box-plot spec from parsed sample values", () => {
    const block = renderDistributionChartToA3(
      payload({ chartType: "box-plot", unit: "N·m", samples: [{ id: "s1", value: "3" }] }),
      ENTRY,
    );
    expect(block.image?.spec).toEqual({ kind: "box-plot", unit: "N·m", values: [3] });
  });

  /**
   * D-188/P-26: unlike histogram/scatter's Tooltip-only `unit`/`xLabel`
   * fallbacks (never rendered without a Tooltip), the box plot's single
   * `<XAxis dataKey="name">` tick is genuinely visible, so a blank `unit`
   * must resolve to a real, language-appropriate word rather than an
   * always-English one.
   */
  it("falls back to a language-appropriate axis label when unit is left blank", () => {
    const englishBlock = renderDistributionChartToA3(
      payload({ chartType: "box-plot", unit: "", samples: [{ id: "s1", value: "3" }] }),
      { ...ENTRY, language: "en" },
    );
    expect(englishBlock.image?.spec).toEqual({ kind: "box-plot", unit: "Value", values: [3] });

    const turkishBlock = renderDistributionChartToA3(
      payload({ chartType: "box-plot", unit: "", samples: [{ id: "s1", value: "3" }] }),
      { ...ENTRY, language: "tr" },
    );
    expect(turkishBlock.image?.spec).toEqual({ kind: "box-plot", unit: "Değer", values: [3] });
  });

  it("parses a valid positive binCount override", () => {
    const block = renderDistributionChartToA3(payload({ chartType: "histogram", binCount: "6" }), ENTRY);
    expect((block.image?.spec as { binCount?: number }).binCount).toBe(6);
  });

  it("ignores a non-numeric or non-positive binCount, leaving it undefined for Sturges' rule", () => {
    const block = renderDistributionChartToA3(payload({ chartType: "histogram", binCount: "abc" }), ENTRY);
    expect((block.image?.spec as { binCount?: number }).binCount).toBeUndefined();
  });
});
