import { describe, expect, it } from "vitest";
import type { ColumnDef, RowDef, SheetDescriptor } from "../../../a3/descriptor";
import {
  MAX_SCALE,
  MIN_SCALE,
  centeredOrigin,
  clampScale,
  columnWidthPx,
  fitToWindowScale,
  panBy,
  rowHeightPx,
  sheetSizePx,
  zoomAtPoint,
} from "./zoomMath";

describe("clampScale", () => {
  it("passes a scale inside the range through unchanged", () => {
    expect(clampScale(1)).toBe(1);
  });

  it("clamps below the floor and above the ceiling", () => {
    expect(clampScale(0)).toBe(MIN_SCALE);
    expect(clampScale(100)).toBe(MAX_SCALE);
  });
});

describe("columnWidthPx / rowHeightPx", () => {
  it("converts a column's Excel char-width to CSS pixels", () => {
    // excelColumnWidthToPt(8.43) matches Excel's own default column width
    // (~64px at 96dpi); PT_TO_PX brings it back to px — round-trip sanity.
    expect(columnWidthPx({ key: "A", charWidth: 8.43 })).toBeGreaterThan(0);
  });

  it("converts a row's point height to CSS pixels at 96/72", () => {
    expect(rowHeightPx({ index: 0, heightPt: 72 })).toBeCloseTo(96);
  });
});

describe("sheetSizePx", () => {
  function sheet(columns: readonly ColumnDef[], rows: readonly RowDef[]): SheetDescriptor {
    return {
      name: "s",
      columns,
      rows,
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
        printArea: "A1:A1",
        zoomPercent: 70,
      },
      freezePanes: false,
      gridlinesVisible: false,
    };
  }

  it("sums column widths and row heights across the whole sheet", () => {
    const s = sheet(
      [
        { key: "A", charWidth: 10 },
        { key: "B", charWidth: 10 },
      ],
      [
        { index: 0, heightPt: 20 },
        { index: 1, heightPt: 20 },
      ],
    );

    const { widthPx, heightPx } = sheetSizePx(s);

    expect(widthPx).toBeCloseTo(columnWidthPx({ key: "A", charWidth: 10 }) * 2);
    expect(heightPx).toBeCloseTo(rowHeightPx({ index: 0, heightPt: 20 }) * 2);
  });

  it("is zero for a sheet with no columns or rows", () => {
    const { widthPx, heightPx } = sheetSizePx(sheet([], []));

    expect(widthPx).toBe(0);
    expect(heightPx).toBe(0);
  });
});

describe("fitToWindowScale", () => {
  it("shrinks a sheet larger than the container to fit the tighter axis", () => {
    // 2000×1000 sheet in an 800×800 box: width is the binding constraint (0.4), not height (0.8).
    expect(fitToWindowScale(2000, 1000, 800, 800)).toBeCloseTo(0.4);
  });

  it("never scales a small sheet up past 1 — a small sheet shows at natural size", () => {
    expect(fitToWindowScale(200, 100, 800, 800)).toBe(1);
  });

  it("falls back to 1 for a degenerate (zero-size) container or sheet", () => {
    expect(fitToWindowScale(0, 0, 800, 800)).toBe(1);
    expect(fitToWindowScale(2000, 1000, 0, 0)).toBe(1);
  });
});

describe("zoomAtPoint", () => {
  const start = { scale: 1, originX: 0, originY: 0 };

  it("zooms in on a negative wheel delta (scroll-up convention)", () => {
    const next = zoomAtPoint(start, 100, 100, -100);

    expect(next.scale).toBeGreaterThan(1);
  });

  it("zooms out on a positive wheel delta", () => {
    const next = zoomAtPoint(start, 100, 100, 100);

    expect(next.scale).toBeLessThan(1);
  });

  /**
   * The whole point of the feature Barış asked for: the content pixel under
   * the cursor before the zoom must be the same content pixel under the
   * cursor after it, not just "zoom toward the top-left corner".
   */
  it("keeps the content point under the cursor fixed through the zoom", () => {
    const before = { scale: 1, originX: -50, originY: -30 };
    const pointerX = 200;
    const pointerY = 150;
    const contentXBefore = (pointerX - before.originX) / before.scale;
    const contentYBefore = (pointerY - before.originY) / before.scale;

    const after = zoomAtPoint(before, pointerX, pointerY, -240);
    const contentXAfter = (pointerX - after.originX) / after.scale;
    const contentYAfter = (pointerY - after.originY) / after.scale;

    expect(contentXAfter).toBeCloseTo(contentXBefore);
    expect(contentYAfter).toBeCloseTo(contentYBefore);
  });

  it("clamps at the zoom ceiling without throwing or overshooting", () => {
    const next = zoomAtPoint({ scale: MAX_SCALE, originX: 0, originY: 0 }, 0, 0, -10000);

    expect(next.scale).toBe(MAX_SCALE);
  });

  it("clamps at the zoom floor without throwing or overshooting", () => {
    const next = zoomAtPoint({ scale: MIN_SCALE, originX: 0, originY: 0 }, 0, 0, 10000);

    expect(next.scale).toBe(MIN_SCALE);
  });

  it("returns the identical object when already clamped and the wheel pushes further past the limit", () => {
    const atCeiling = { scale: MAX_SCALE, originX: 5, originY: 5 };

    expect(zoomAtPoint(atCeiling, 0, 0, -10000)).toBe(atCeiling);
  });
});

describe("centeredOrigin", () => {
  it("centers a smaller-than-viewport sheet with equal margins on both axes", () => {
    const { originX, originY } = centeredOrigin(1, 400, 200, 800, 800);

    expect(originX).toBeCloseTo(200);
    expect(originY).toBeCloseTo(300);
  });
});

describe("panBy", () => {
  it("adds the delta to the current origin, leaving scale untouched", () => {
    const next = panBy({ scale: 2, originX: 10, originY: 20 }, 5, -5);

    expect(next).toEqual({ scale: 2, originX: 15, originY: 15 });
  });
});
