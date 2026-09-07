import { describe, expect, it } from "vitest";
import type { Entry } from "../../domain/model";
import type { RowDef } from "../descriptor";
import type { A3EntryRendererMap } from "../methodContract";
import type { TemplateBlock } from "../templates/types";
import type { ColumnWidth } from "./contentStyle";
import { placeBlockContent } from "./place";

function fixtureBlock(overrides: Partial<TemplateBlock> = {}): TemplateBlock {
  return {
    appSteps: [2],
    label: "2. MEVCUT DURUM ANALİZİ",
    headerRange: "B22:O22",
    headerFill: "FFFFFFFF",
    headerStyleId: "blockHeaderPlan",
    bodyStyleId: "entryContent",
    contentColumns: { first: "B", last: "O" },
    contentRows: { start: 23, end: 32 },
    ...overrides,
  };
}

function fixtureEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: "entry-1",
    methodId: "pareto",
    title: "Pareto",
    order: 0,
    a3Visibility: "primary",
    payload: {},
    images: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    provenance: { origin: "human" },
    ...overrides,
  } as Entry;
}

const columnWidths: readonly ColumnWidth[] = [
  { key: "B", widthPt: 150 },
  { key: "C", widthPt: 150 },
];

function contentRows(start: number, end: number, heightPt = 30): readonly RowDef[] {
  const rows: RowDef[] = [];
  for (let index = start; index <= end; index += 1) {
    rows.push({ index, heightPt });
  }
  return rows;
}

describe("placeBlockContent — image content (D-102)", () => {
  it("reserves rowSpan rows for an image and records a pending slot with summed pt height", () => {
    const rendererMap: A3EntryRendererMap = {
      pareto: () => ({ lines: [], image: { kind: "pareto-chart", spec: { foo: 1 }, rowSpan: 4 } }),
    };
    const block = fixtureBlock();
    const result = placeBlockContent([fixtureEntry()], block, contentRows(23, 32), columnWidths, rendererMap, "en");

    expect(result.droppedEntryIds).toEqual([]);
    expect(result.placedEntryIds).toEqual(["entry-1"]);
    expect(result.cells).toEqual([]);
    expect(result.pendingImages).toHaveLength(1);
    expect(result.pendingImages[0]).toEqual({
      entryId: "entry-1",
      kind: "pareto-chart",
      spec: { foo: 1 },
      anchorCell: "B23",
      widthPt: 300,
      heightPt: 120,
    });
  });

  it("places a title line before the image and anchors the image after it", () => {
    const rendererMap: A3EntryRendererMap = {
      pareto: () => ({
        lines: [{ text: "Pareto — Hat 3", bold: true }],
        image: { kind: "pareto-chart", spec: {}, rowSpan: 3 },
      }),
    };
    const block = fixtureBlock();
    const result = placeBlockContent([fixtureEntry()], block, contentRows(23, 32), columnWidths, rendererMap, "en");

    expect(result.cells).toHaveLength(1);
    expect(result.cells[0]!.ref).toBe("B23");
    expect(result.pendingImages[0]!.anchorCell).toBe("B24");
  });

  it("drops the whole entry when the image doesn't fit the remaining budget", () => {
    const rendererMap: A3EntryRendererMap = {
      pareto: () => ({ lines: [], image: { kind: "pareto-chart", spec: {}, rowSpan: 50 } }),
    };
    const block = fixtureBlock();
    const result = placeBlockContent([fixtureEntry()], block, contentRows(23, 32), columnWidths, rendererMap, "en");

    expect(result.placedEntryIds).toEqual([]);
    expect(result.droppedEntryIds).toEqual(["entry-1"]);
    expect(result.pendingImages).toEqual([]);
  });

  it("drops the entry when text exactly fills the block, leaving the image no room", () => {
    // Phase 5 review regression: this used to report the entry as *placed*
    // and emit a slot with `heightPt: 0` anchored one row past the block —
    // the rasterizer would capture a zero-height PNG and the writer would
    // embed it outside its own block.
    const rendererMap: A3EntryRendererMap = {
      pareto: () => ({
        lines: [{ text: "line one" }, { text: "line two" }],
        image: { kind: "pareto-chart", spec: {} },
      }),
    };
    const block = fixtureBlock({ contentRows: { start: 23, end: 24 } });
    const result = placeBlockContent(
      [fixtureEntry()],
      block,
      contentRows(23, 24),
      columnWidths,
      rendererMap,
      "en",
    );

    expect(result.placedEntryIds).toEqual([]);
    expect(result.droppedEntryIds).toEqual(["entry-1"]);
    expect(result.pendingImages).toEqual([]);
  });

  it("never emits a zero-height image slot", () => {
    const rendererMap: A3EntryRendererMap = {
      pareto: () => ({ lines: [{ text: "t" }], image: { kind: "pareto-chart", spec: {} } }),
    };
    const block = fixtureBlock({ contentRows: { start: 23, end: 30 } });
    const result = placeBlockContent(
      [fixtureEntry()],
      block,
      contentRows(23, 30),
      columnWidths,
      rendererMap,
      "en",
    );

    for (const slot of result.pendingImages) {
      expect(slot.heightPt).toBeGreaterThan(0);
      expect(slot.widthPt).toBeGreaterThan(0);
    }
  });

  it("defaults rowSpan to whatever budget remains in the block when omitted", () => {
    const rendererMap: A3EntryRendererMap = {
      pareto: () => ({ lines: [], image: { kind: "pareto-chart", spec: {} } }),
    };
    const block = fixtureBlock({ contentRows: { start: 23, end: 27 } });
    const result = placeBlockContent(
      [fixtureEntry()],
      block,
      contentRows(23, 27),
      columnWidths,
      rendererMap,
      "en",
    );

    expect(result.pendingImages[0]!.heightPt).toBe(150); // 5 rows * 30pt
  });
});

describe("placeBlockContent — zones content (D-102)", () => {
  it("partitions one entry's zones across the remaining columns and consumes the rest of the block", () => {
    const rendererMap: A3EntryRendererMap = {
      pareto: () => ({
        lines: [],
        zones: [
          { widthFraction: 0.5, lines: [{ text: "Öncelikli hedefler" }] },
          { widthFraction: 0.5, image: { kind: "trajectory-chart", spec: { series: [] } } },
        ],
      }),
    };
    const block = fixtureBlock({ contentRows: { start: 58, end: 58 } });
    const result = placeBlockContent(
      [fixtureEntry()],
      block,
      contentRows(58, 58, 153.75),
      columnWidths,
      rendererMap,
      "en",
    );

    expect(result.placedEntryIds).toEqual(["entry-1"]);
    expect(result.cells).toEqual([{ ref: "B58", value: "Öncelikli hedefler", styleId: "entryContent" }]);
    expect(result.pendingImages).toEqual([
      {
        entryId: "entry-1",
        kind: "trajectory-chart",
        spec: { series: [] },
        anchorCell: "C58",
        widthPt: 150,
        heightPt: 153.75,
      },
    ]);
  });

  it("drops the entry rather than silently losing zones that have no column to sit in", () => {
    // Phase 5 review regression: with more zones than content columns, the
    // surplus zones' text and charts used to vanish from the sheet with no
    // dropped id and no overflow warning — the silent truncation SPEC.md
    // §2.3 forbids. Routing the whole entry to an appendix is the D-100 rule.
    const rendererMap: A3EntryRendererMap = {
      pareto: () => ({
        lines: [],
        zones: [
          { widthFraction: 0.25, lines: [{ text: "A" }] },
          { widthFraction: 0.25, lines: [{ text: "B" }] },
          { widthFraction: 0.25, lines: [{ text: "C — must not vanish" }] },
          { widthFraction: 0.25, image: { kind: "trajectory-chart", spec: {} } },
        ],
      }),
    };
    const block = fixtureBlock({ contentRows: { start: 58, end: 58 } });
    const result = placeBlockContent(
      [fixtureEntry()],
      block,
      contentRows(58, 58, 153.75),
      columnWidths, // only two columns for four zones
      rendererMap,
      "en",
    );

    expect(result.placedEntryIds).toEqual([]);
    expect(result.droppedEntryIds).toEqual(["entry-1"]);
    expect(result.cells).toEqual([]);
    expect(result.pendingImages).toEqual([]);
  });

  it("drops a second entry when the zoned entry already consumed the whole block", () => {
    const rendererMap: A3EntryRendererMap = {
      pareto: () => ({ lines: [], zones: [{ widthFraction: 1, lines: [{ text: "x" }] }] }),
    };
    const block = fixtureBlock({ contentRows: { start: 58, end: 58 } });
    const result = placeBlockContent(
      [fixtureEntry({ id: "entry-1" }), fixtureEntry({ id: "entry-2" })],
      block,
      contentRows(58, 58, 153.75),
      columnWidths,
      rendererMap,
      "en",
    );

    expect(result.placedEntryIds).toEqual(["entry-1"]);
    expect(result.droppedEntryIds).toEqual(["entry-2"]);
  });

  it("D-224: places a second zoned entry after the first when the first declares an explicit zonesRowSpan", () => {
    // Faz 11/L1: pps-8step-auto's ADIM 1 hosts `fiveN1K` (zonesRowSpan 4)
    // then `gapStatement` (zonesRowSpan 8) as two independent entries in one
    // 12-row block — before this fix, any zoned entry silently consumed the
    // whole rest of the block (`row = lastRow + 1` unconditionally), which
    // would have dropped whichever of the two came second, in either order.
    const rendererMap: A3EntryRendererMap = {
      "five-n1k": () => ({
        lines: [],
        zonesRowSpan: 4,
        zones: [{ widthFraction: 1, lines: [{ text: "NE?" }] }],
      }),
      "gap-statement": () => ({
        lines: [],
        zonesRowSpan: 8,
        zones: [{ widthFraction: 1, lines: [{ text: "1.2 Gap Analizi" }] }],
      }),
    };
    const block = fixtureBlock({ contentRows: { start: 8, end: 19 } }); // 12 rows
    const result = placeBlockContent(
      [
        fixtureEntry({ id: "entry-1", methodId: "five-n1k" }),
        fixtureEntry({ id: "entry-2", methodId: "gap-statement" }),
      ],
      block,
      contentRows(8, 19, 13),
      columnWidths,
      rendererMap,
      "en",
    );

    expect(result.droppedEntryIds).toEqual([]);
    expect(result.placedEntryIds).toEqual(["entry-1", "entry-2"]);
    expect(result.cells).toEqual([
      { ref: "B8", value: "NE?", styleId: "entryContent" },
      { ref: "B12", value: "1.2 Gap Analizi", styleId: "entryContent" },
    ]);
  });

  it("D-224: still drops a second zoned entry that doesn't fit after an explicit zonesRowSpan leaves too little room", () => {
    const rendererMap: A3EntryRendererMap = {
      "five-n1k": () => ({
        lines: [],
        zonesRowSpan: 12,
        zones: [{ widthFraction: 1, lines: [{ text: "NE?" }] }],
      }),
      "gap-statement": () => ({
        lines: [],
        zonesRowSpan: 8,
        zones: [{ widthFraction: 1, lines: [{ text: "1.2 Gap Analizi" }] }],
      }),
    };
    const block = fixtureBlock({ contentRows: { start: 8, end: 19 } }); // 12 rows total, only 2 left after the first
    const result = placeBlockContent(
      [
        fixtureEntry({ id: "entry-1", methodId: "five-n1k" }),
        fixtureEntry({ id: "entry-2", methodId: "gap-statement" }),
      ],
      block,
      contentRows(8, 19, 13),
      columnWidths,
      rendererMap,
      "en",
    );

    expect(result.placedEntryIds).toEqual(["entry-1"]);
    expect(result.droppedEntryIds).toEqual(["entry-2"]);
  });
});

describe("placeBlockContent — tone-reinforced status lines (P-37)", () => {
  it("picks the toned bold style id for a bold line carrying a tone", () => {
    const rendererMap: A3EntryRendererMap = {
      pareto: () => ({ lines: [{ text: "■ Approved", bold: true, tone: "positive" }] }),
    };
    const block = fixtureBlock();
    const result = placeBlockContent([fixtureEntry()], block, contentRows(23, 32), columnWidths, rendererMap, "en");

    expect(result.cells).toEqual([{ ref: "B23", value: "■ Approved", styleId: "entryContentBoldPositive" }]);
  });

  it("picks the toned non-bold style id for a plain line carrying a tone", () => {
    const rendererMap: A3EntryRendererMap = {
      pareto: () => ({ lines: [{ text: "▲ open", tone: "negative" }] }),
    };
    const block = fixtureBlock();
    const result = placeBlockContent([fixtureEntry()], block, contentRows(23, 32), columnWidths, rendererMap, "en");

    expect(result.cells).toEqual([{ ref: "B23", value: "▲ open", styleId: "entryContentNegative" }]);
  });

  it("falls back to the untoned style ids when a line carries no tone", () => {
    const rendererMap: A3EntryRendererMap = {
      pareto: () => ({ lines: [{ text: "Plain", bold: true }, { text: "Also plain" }] }),
    };
    const block = fixtureBlock();
    const result = placeBlockContent([fixtureEntry()], block, contentRows(23, 32), columnWidths, rendererMap, "en");

    expect(result.cells).toEqual([
      { ref: "B23", value: "Plain", styleId: "entryContentBold" },
      { ref: "B24", value: "Also plain", styleId: "entryContent" },
    ]);
  });
});
