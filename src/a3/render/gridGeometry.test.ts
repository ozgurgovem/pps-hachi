import { describe, expect, it } from "vitest";
import type { SheetDescriptor } from "../descriptor";
import { excelColumnWidthToPt } from "../layout/measure";
import { columnOffsetPx, columnWidthPx, rowHeightPx, rowOffsetPx } from "./gridGeometry";

const PT_TO_PX = 96 / 72;

function fixtureSheet(): SheetDescriptor {
  return {
    name: "A3",
    // charWidth is the OOXML stored width; excelColumnWidthToPt (D-154's own
    // trap) converts it — using round numbers here keeps the expected pt
    // values simple without needing to reproduce that formula by hand.
    columns: [
      { key: "A", charWidth: 10 },
      { key: "B", charWidth: 10 },
      { key: "C", charWidth: 10 },
    ],
    rows: [
      { index: 6, heightPt: 13 },
      { index: 7, heightPt: 13 },
      { index: 8, heightPt: 20 },
    ],
    merges: [],
    cells: [],
    images: [],
    pageSetup: {
      paperSize: "A3",
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      marginsIn: { top: 0, bottom: 0, left: 0, right: 0 },
      printArea: "A1:C8",
      zoomPercent: 100,
    },
    freezePanes: false,
    gridlinesVisible: false,
  };
}

describe("columnOffsetPx", () => {
  it("is 0 for the first column, at any scale", () => {
    expect(columnOffsetPx(fixtureSheet(), "A", 1)).toBe(0);
  });

  it("sums every preceding column's pixel width, scaled", () => {
    const sheet = fixtureSheet();
    const widthA = columnWidthPx(sheet, "A", 1)!;
    const widthB = columnWidthPx(sheet, "B", 1)!;
    expect(columnOffsetPx(sheet, "C", 1)).toBeCloseTo(widthA + widthB, 5);
  });

  it("scales linearly with the print-mode fit scale", () => {
    const sheet = fixtureSheet();
    const unscaled = columnOffsetPx(sheet, "C", 1)!;
    expect(columnOffsetPx(sheet, "C", 0.5)).toBeCloseTo(unscaled * 0.5, 5);
  });

  it("returns undefined for a column key not present on the sheet", () => {
    expect(columnOffsetPx(fixtureSheet(), "Z", 1)).toBeUndefined();
  });
});

describe("columnWidthPx", () => {
  it("matches HtmlA3Renderer's own conversion constant (charWidth in pt * 96/72)", () => {
    const sheet = fixtureSheet();
    const expectedPt = excelColumnWidthToPt(10);
    expect(columnWidthPx(sheet, "A", 1)).toBeCloseTo(expectedPt * PT_TO_PX, 5);
  });

  it("returns undefined for an unknown column key", () => {
    expect(columnWidthPx(fixtureSheet(), "Z", 1)).toBeUndefined();
  });
});

describe("rowOffsetPx", () => {
  it("is 0 for the sheet's first row, regardless of its own row index number", () => {
    expect(rowOffsetPx(fixtureSheet(), 6, 1)).toBe(0);
  });

  it("sums every preceding row's pixel height, scaled", () => {
    const sheet = fixtureSheet();
    expect(rowOffsetPx(sheet, 8, 1)).toBeCloseTo(13 * PT_TO_PX * 2, 5);
  });

  it("returns undefined for a row index the sheet doesn't contain", () => {
    expect(rowOffsetPx(fixtureSheet(), 999, 1)).toBeUndefined();
  });
});

describe("rowHeightPx", () => {
  it("returns the scaled pixel height of a specific row", () => {
    expect(rowHeightPx(fixtureSheet(), 8, 1)).toBeCloseTo(20 * PT_TO_PX, 5);
  });

  it("scales with the print-mode fit scale", () => {
    expect(rowHeightPx(fixtureSheet(), 8, 0.5)).toBeCloseTo(20 * PT_TO_PX * 0.5, 5);
  });

  it("returns undefined for a row index the sheet doesn't contain", () => {
    expect(rowHeightPx(fixtureSheet(), 999, 1)).toBeUndefined();
  });
});
