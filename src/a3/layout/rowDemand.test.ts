import { describe, expect, it } from "vitest";
import { allocateRunRows } from "./rowDemand";

const INF = Number.POSITIVE_INFINITY;

/**
 * The bug this function exists to prevent (Barış, 2026-09-23): ADIM 1's two
 * side-by-side charts declare no `rowSpan`, so placement gave them every row
 * the block had and a third entry — a defect photo marked "Birincil" — was
 * dropped to an appendix every single time. Any third entry on that step hit
 * it, not just photos.
 */
describe("allocateRunRows", () => {
  it("gives a lone run everything", () => {
    expect(allocateRunRows([INF], 12)).toEqual([12]);
    expect(allocateRunRows([3], 12)).toEqual([12]);
  });

  it("never lets one run take everything when another still needs rows", () => {
    const allocation = allocateRunRows([INF, 11], 22);
    expect(allocation).toHaveLength(2);
    expect(allocation[1]).toBeGreaterThan(0);
    expect(allocation.reduce((a, b) => a + b, 0)).toBe(22);
  });

  it("gives every run its full ask when the block is big enough", () => {
    expect(allocateRunRows([4, 6], 20)).toEqual([4, 16]);
  });

  it("hands the surplus to the run that said it had no natural size", () => {
    expect(allocateRunRows([4, INF], 20)).toEqual([4, 16]);
    expect(allocateRunRows([INF, 4], 20)).toEqual([16, 4]);
  });

  it("shares proportionally when the runs together want more than the block has", () => {
    // 24 and 11 wanted, 22 available -> roughly 2:1, and exactly 22 handed out.
    const allocation = allocateRunRows([24, 11], 22);
    expect(allocation.reduce((a, b) => a + b, 0)).toBe(22);
    expect(allocation[0]).toBeGreaterThan(allocation[1]!);
    expect(allocation[1]).toBeGreaterThanOrEqual(5);
  });

  it("gives every run at least one row while any rows remain", () => {
    const allocation = allocateRunRows([50, 50, 50], 5);
    expect(allocation.every((rows) => rows >= 1)).toBe(true);
    expect(allocation.reduce((a, b) => a + b, 0)).toBe(5);
  });

  it("leaves the runs that genuinely do not fit with nothing, for the usual appendix route", () => {
    expect(allocateRunRows([5, 5, 5], 2)).toEqual([1, 1, 0]);
  });

  it("never hands out more rows than the block has", () => {
    for (const available of [3, 7, 12, 22, 40]) {
      for (const demands of [[INF, INF], [30, 2], [1, 1, 1, 30], [INF, 6, 9]]) {
        const total = allocateRunRows(demands, available).reduce((a, b) => a + b, 0);
        expect(total, `${JSON.stringify(demands)} @ ${available}`).toBeLessThanOrEqual(available);
      }
    }
  });
});
