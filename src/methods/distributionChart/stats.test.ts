import { describe, expect, it } from "vitest";
import { computeBoxPlotStats, computeHistogramBins, parsePoints, parseSampleValues, sturgesBinCount } from "./stats";

describe("parseSampleValues", () => {
  it("parses numeric strings and drops blank/non-numeric ones", () => {
    expect(
      parseSampleValues([
        { id: "1", value: "12.4" },
        { id: "2", value: "" },
        { id: "3", value: "  " },
        { id: "4", value: "n/a" },
        { id: "5", value: "8" },
      ]),
    ).toEqual([12.4, 8]);
  });
});

describe("parsePoints", () => {
  it("keeps only pairs where both x and y parse", () => {
    expect(
      parsePoints([
        { id: "1", x: "1", y: "2" },
        { id: "2", x: "", y: "5" },
        { id: "3", x: "3", y: "" },
      ]),
    ).toEqual([{ x: 1, y: 2 }]);
  });
});

describe("sturgesBinCount", () => {
  it("returns 1 for 0 or 1 samples", () => {
    expect(sturgesBinCount(0)).toBe(1);
    expect(sturgesBinCount(1)).toBe(1);
  });

  it("grows logarithmically with sample count", () => {
    expect(sturgesBinCount(10)).toBe(Math.ceil(Math.log2(10) + 1));
  });
});

describe("computeHistogramBins", () => {
  it("returns no bins for fewer than 2 values", () => {
    expect(computeHistogramBins([5])).toEqual([]);
    expect(computeHistogramBins([])).toEqual([]);
  });

  it("bins values into the requested bin count, covering the full min–max range", () => {
    const bins = computeHistogramBins([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 2);
    expect(bins).toHaveLength(2);
    expect(bins.reduce((sum, bin) => sum + bin.count, 0)).toBe(10);
  });

  it("puts a single repeated value into one bin without dividing by zero", () => {
    const bins = computeHistogramBins([5, 5, 5], 3);
    expect(bins.some((bin) => bin.count === 3)).toBe(true);
  });
});

describe("computeBoxPlotStats", () => {
  it("returns undefined for fewer than 2 values", () => {
    expect(computeBoxPlotStats([5])).toBeUndefined();
  });

  it("computes min/median/max for an odd-length sorted sample", () => {
    const stats = computeBoxPlotStats([1, 2, 3, 4, 5]);
    expect(stats).toMatchObject({ min: 1, median: 3, max: 5 });
  });

  it("computes quartiles via Tukey's hinges", () => {
    const stats = computeBoxPlotStats([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(stats).toEqual({ min: 1, q1: 2.5, median: 4.5, q3: 6.5, max: 8 });
  });

  it("is order-independent", () => {
    expect(computeBoxPlotStats([5, 1, 4, 2, 3])).toEqual(computeBoxPlotStats([1, 2, 3, 4, 5]));
  });
});
