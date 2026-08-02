import { describe, expect, it } from "vitest";
import { farplas7StepTr } from "../templates/farplas-7step-tr";
import {
  authoredFontFloorPt,
  contentHeightPt,
  excelColumnWidthToPt,
  fitScale,
  printableHeightPt,
  wrapText,
} from "./measure";

describe("measure", () => {
  it("computes A3 landscape printable height from the template's own margins (§9.4: ≈813.5pt)", () => {
    expect(printableHeightPt(farplas7StepTr.marginsIn)).toBeCloseTo(813.5, 1);
  });

  it("sums the template's row heights to the documented content height (§9.1: 1958.75pt for TR)", () => {
    expect(contentHeightPt(farplas7StepTr.rows)).toBeCloseTo(1958.75, 2);
  });

  it("derives a fit scale close to the template's documented ~41.5%", () => {
    expect(fitScale(farplas7StepTr.rows, farplas7StepTr.marginsIn)).toBeCloseTo(0.4153, 3);
  });

  it("computes an authored font floor that actually guarantees the printed floor (D-40)", () => {
    const floor = authoredFontFloorPt(farplas7StepTr.rows, farplas7StepTr.marginsIn, 8);
    expect(floor * fitScale(farplas7StepTr.rows, farplas7StepTr.marginsIn)).toBeGreaterThanOrEqual(8);
  });

  it("converts Excel character-width units to a positive point value, monotonically", () => {
    const narrow = excelColumnWidthToPt(2);
    const wide = excelColumnWidthToPt(20);
    expect(narrow).toBeGreaterThan(0);
    expect(wide).toBeGreaterThan(narrow);
  });

  it("wraps text into lines no wider than the given character budget", () => {
    const lines = wrapText("kapı panelinde gürültü tespit edildi ve doğrulandı", 12);
    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) {
      // A single overlong word is allowed to exceed the budget on its own line.
      expect(line.split(" ").length === 1 || line.length <= 12).toBe(true);
    }
  });

  it("returns an empty array for blank text", () => {
    expect(wrapText("   ", 10)).toEqual([]);
  });
});
