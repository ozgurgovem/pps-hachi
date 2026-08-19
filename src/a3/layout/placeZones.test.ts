import { describe, expect, it } from "vitest";
import type { RowDef } from "../descriptor";
import type { A3ContentZone } from "../methodContract";
import type { ColumnWidth } from "./contentStyle";
import { placeZonesContent } from "./placeZones";

function contentRows(start: number, end: number, heightPt = 30): readonly RowDef[] {
  const rows: RowDef[] = [];
  for (let index = start; index <= end; index += 1) {
    rows.push({ index, heightPt });
  }
  return rows;
}

describe("placeZonesContent — multi-line zone content (D-189/P-43 Kusur 1)", () => {
  it("spreads a zone's lines across separate physical rows when the band has room", () => {
    const columnWidths: readonly ColumnWidth[] = [
      { key: "B", widthPt: 200 },
      { key: "C", widthPt: 200 },
    ];
    const zones: readonly A3ContentZone[] = [
      { widthFraction: 0.5, lines: [{ text: "Label", bold: true }, { text: "Answer" }] },
      { widthFraction: 0.5, lines: [{ text: "Other" }] },
    ];

    const result = placeZonesContent("entry-1", zones, 10, 12, contentRows(10, 12), columnWidths);

    expect(result).toBeDefined();
    // Zone 1: two lines, two rows available -> one line per row, no join.
    expect(result!.cells).toContainEqual({ ref: "B10", value: "Label", styleId: "entryContentBold" });
    expect(result!.cells).toContainEqual({ ref: "B11", value: "Answer", styleId: "entryContent" });
    // Zone 2: only one line -> top-aligned, row 12 (its second available row) stays blank.
    expect(result!.cells).toContainEqual({ ref: "C10", value: "Other", styleId: "entryContent" });
    expect(result!.cells.some((cell) => cell.ref === "C11" || cell.ref === "C12")).toBe(false);
    // Never a joined `\n` cell when separate rows are available.
    expect(result!.cells.every((cell) => !String(cell.value).includes("\n"))).toBe(true);
  });

  it("falls back to one \\n-joined row when the band is shorter than the zone's own line count — zero change for smart-target's shape", () => {
    const columnWidths: readonly ColumnWidth[] = [
      { key: "B", widthPt: 200 },
      { key: "C", widthPt: 200 },
    ];
    const zones: readonly A3ContentZone[] = [
      { widthFraction: 0.5, lines: [{ text: "Title" }, { text: "• bullet" }] },
      { widthFraction: 0.5, lines: [{ text: "Commitment" }] },
    ];

    const result = placeZonesContent("entry-1", zones, 58, 58, contentRows(58, 58, 153.75), columnWidths);

    expect(result).toBeDefined();
    expect(result!.cells).toContainEqual({ ref: "B58", value: "Title\n• bullet", styleId: "entryContent" });
    expect(result!.cells).toContainEqual({ ref: "C58", value: "Commitment", styleId: "entryContent" });
  });

  it("leaves a zone with no lines (image-only) untouched by the row-reservation math", () => {
    const columnWidths: readonly ColumnWidth[] = [
      { key: "B", widthPt: 200 },
      { key: "C", widthPt: 200 },
    ];
    const zones: readonly A3ContentZone[] = [
      { widthFraction: 0.5, lines: [{ text: "One" }, { text: "Two" }, { text: "Three" }] },
      { widthFraction: 0.5, image: { kind: "trajectory-chart", spec: {} } },
    ];

    const result = placeZonesContent("entry-1", zones, 10, 13, contentRows(10, 13), columnWidths);

    expect(result).toBeDefined();
    expect(result!.cells.filter((cell) => cell.ref.startsWith("C"))).toEqual([]);
    expect(result!.pendingImages).toHaveLength(1);
    // The image zone still reserves the *entire* band height, unaffected by the sibling zone's row count.
    expect(result!.pendingImages[0]!.heightPt).toBe(120);
  });
});

describe("placeZonesContent — width-aware column snapping (D-189/P-43 Kusur 2)", () => {
  /** farplas-7step-tr.ts's real B:O column widths in pt (D-189/§15.3), transcribed once rather than re-derived per test. */
  const REAL_B_TO_O_WIDTHS: readonly ColumnWidth[] = [
    { key: "B", widthPt: 112.5 },
    { key: "C", widthPt: 112.5 },
    { key: "D", widthPt: 15.75 },
    { key: "E", widthPt: 127.5 },
    { key: "F", widthPt: 122.25 },
    { key: "G", widthPt: 122.25 },
    { key: "H", widthPt: 18 },
    { key: "I", widthPt: 127.5 },
    { key: "J", widthPt: 122.25 },
    { key: "K", widthPt: 122.25 },
    { key: "L", widthPt: 18 },
    { key: "M", widthPt: 127.5 },
    { key: "N", widthPt: 237.75 },
    { key: "O", widthPt: 8.25 },
  ];

  function sixEqualZones(): readonly A3ContentZone[] {
    return Array.from({ length: 6 }, () => ({ widthFraction: 1 / 6, lines: [{ text: "x" }] }));
  }

  it("never strands a zone entirely on the near-zero-width trailing gutter column (five-n1k's real shape)", () => {
    const result = placeZonesContent(
      "entry-1",
      sixEqualZones(),
      10,
      21,
      contentRows(10, 21),
      REAL_B_TO_O_WIDTHS,
    );

    expect(result).toBeDefined();
    // Pre-fix: the sixth zone's cell was the lone, unmerged "O10" (8.25pt).
    // Post-fix: it must widen to include N (246pt), matching its siblings.
    expect(result!.cells.some((cell) => cell.ref === "O10")).toBe(false);
    expect(result!.cells).toContainEqual({ ref: "N10", value: "x", styleId: "entryContent" });
    expect(result!.merges).toContainEqual({ range: "N10:O10" });
  });

  it("leaves smart-target's already-approved (D-38/D-178) three-zone widths completely untouched", () => {
    const zones: readonly A3ContentZone[] = [
      { widthFraction: 0.32, lines: [{ text: "A" }] },
      { widthFraction: 0.4, lines: [{ text: "B" }] },
      { widthFraction: 0.28, lines: [{ text: "C" }] },
    ];

    const result = placeZonesContent("entry-1", zones, 58, 58, contentRows(58, 58, 153.75), REAL_B_TO_O_WIDTHS);

    expect(result).toBeDefined();
    // D-189/§15.5's own numbers: B:F 490.5pt, G:L 530.25pt, M:O 373.5pt — none
    // of the three ever falls under the 50% borrow threshold, so no column
    // ever moves across the D-178-approved boundaries.
    expect(result!.cells).toContainEqual({ ref: "B58", value: "A", styleId: "entryContent" });
    expect(result!.merges).toContainEqual({ range: "B58:F58" });
    expect(result!.cells).toContainEqual({ ref: "G58", value: "B", styleId: "entryContent" });
    expect(result!.merges).toContainEqual({ range: "G58:L58" });
    expect(result!.cells).toContainEqual({ ref: "M58", value: "C", styleId: "entryContent" });
    expect(result!.merges).toContainEqual({ range: "M58:O58" });
  });
});
