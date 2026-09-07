import { describe, expect, it } from "vitest";
import type { Entry, StepId } from "../../domain/model";
import type { A3EntryRendererMap } from "../methodContract";
import { farplas7StepTr } from "../templates/farplas-7step-tr";
import { pps8StepAuto } from "../templates/pps-8step-auto";
import type { A3Template, TemplateBlock } from "../templates/types";
import type { ColumnWidth } from "./contentStyle";
import type { EntryWithStep } from "./entriesByBlock";
import { estimateBlockRowDemand, resolveElasticBlocks } from "./elasticAllocation";

const wideColumns: readonly ColumnWidth[] = [{ key: "A", widthPt: 1000 }];

function fixtureEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: "entry-1",
    methodId: "fixture",
    title: "Fixture entry",
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

function entryWithStep(stepId: StepId, overrides: Partial<Entry> = {}): EntryWithStep {
  return { entry: fixtureEntry(overrides), stepId };
}

function linesOf(count: number): readonly { text: string }[] {
  return Array.from({ length: count }, (_, index) => ({ text: `line-${index}` }));
}

describe("estimateBlockRowDemand", () => {
  it("returns 0 for a block with no entries", () => {
    expect(estimateBlockRowDemand([], wideColumns, {}, "en")).toBe(0);
  });

  it("sums one wrapped row per line for plain-lines content", () => {
    const rendererMap: A3EntryRendererMap = { fixture: () => ({ lines: linesOf(3) }) };
    expect(estimateBlockRowDemand([fixtureEntry()], wideColumns, rendererMap, "en")).toBe(3);
  });

  it("sums demand across multiple entries", () => {
    const rendererMap: A3EntryRendererMap = {
      a: () => ({ lines: linesOf(2) }),
      b: () => ({ lines: linesOf(3) }),
    };
    const entries = [fixtureEntry({ id: "e1", methodId: "a" }), fixtureEntry({ id: "e2", methodId: "b" })];
    expect(estimateBlockRowDemand(entries, wideColumns, rendererMap, "en")).toBe(5);
  });

  it("uses an explicit zonesRowSpan as the entry's whole demand, ignoring lines", () => {
    const rendererMap: A3EntryRendererMap = {
      fixture: () => ({ lines: linesOf(9), zones: [{ widthFraction: 1 }], zonesRowSpan: 4 }),
    };
    expect(estimateBlockRowDemand([fixtureEntry()], wideColumns, rendererMap, "en")).toBe(4);
  });

  it("is unbounded (Infinity) for zones content with no zonesRowSpan — D-224/Phase 5's own 'fills the rest' fallback", () => {
    const rendererMap: A3EntryRendererMap = {
      fixture: () => ({ lines: [], zones: [{ widthFraction: 1 }] }),
    };
    expect(estimateBlockRowDemand([fixtureEntry()], wideColumns, rendererMap, "en")).toBe(Number.POSITIVE_INFINITY);
  });

  it("adds an image's explicit rowSpan to its lines' row count", () => {
    const rendererMap: A3EntryRendererMap = {
      fixture: () => ({ lines: linesOf(2), image: { kind: "pareto-chart", spec: {}, rowSpan: 6 } }),
    };
    expect(estimateBlockRowDemand([fixtureEntry()], wideColumns, rendererMap, "en")).toBe(8);
  });

  it("is unbounded (Infinity) for an image with no rowSpan — fishbone's own 'fills the rest' fallback", () => {
    const rendererMap: A3EntryRendererMap = {
      fixture: () => ({ lines: [], image: { kind: "fishbone-diagram", spec: {} } }),
    };
    expect(estimateBlockRowDemand([fixtureEntry()], wideColumns, rendererMap, "en")).toBe(Number.POSITIVE_INFINITY);
  });

  it("stays 0 for a methodId with no registered renderer (falls back to a bare title line, but only when the fallback is actually reached)", () => {
    expect(estimateBlockRowDemand([fixtureEntry({ title: "" })], wideColumns, {}, "en")).toBe(0);
  });
});

/** A minimal 3-block elastic column, using pps-8step-auto's own real left-column numbers (D-158/D-160). */
function fixtureElasticTemplate(blocks: readonly TemplateBlock[]): A3Template {
  return {
    id: "fixture-elastic",
    name: "Fixture",
    language: "en",
    columns: [{ key: "A", charWidth: 10 }],
    rows: [],
    merges: [],
    styles: [],
    titleRange: "A1:A1",
    headerFields: [],
    staticCells: [],
    footerFields: [],
    blocks,
    printArea: "A1:A1",
    marginsIn: { top: 0, bottom: 0, left: 0, right: 0 },
    bodyRowHeightPt: 13,
    zoomPercent: 100,
  };
}

function leftColumnBlocks(): readonly TemplateBlock[] {
  return [
    {
      appSteps: [1],
      label: "ADIM 1",
      headerRange: "A4:A5",
      headerFill: "FFFFFFFF",
      headerStyleId: "header",
      bodyStyleId: "body",
      contentColumns: { first: "A", last: "A" },
      contentRows: { start: 6, end: 17 },
      elastic: { minimumCanvasRows: 10 },
    },
    {
      appSteps: [2],
      label: "ADIM 2",
      headerRange: "A18:A19",
      headerFill: "FFFFFFFF",
      headerStyleId: "header",
      bodyStyleId: "body",
      contentColumns: { first: "A", last: "A" },
      contentRows: { start: 20, end: 45 },
      elastic: { minimumCanvasRows: 18 },
    },
    {
      appSteps: [3],
      label: "ADIM 3",
      headerRange: "A46:A47",
      headerFill: "FFFFFFFF",
      headerStyleId: "header",
      bodyStyleId: "body",
      contentColumns: { first: "A", last: "A" },
      contentRows: { start: 48, end: 53 },
      elastic: { minimumCanvasRows: 3 },
    },
  ];
}

describe("resolveElasticBlocks", () => {
  it("leaves every block unchanged for a template with no `.elastic` declarations (farplas-7step-tr)", () => {
    const resolved = resolveElasticBlocks(farplas7StepTr, [], {}, "en");
    expect(resolved).toEqual(farplas7StepTr.blocks);
  });

  it("reproduces pps-8step-auto's own shipped defaults byte-for-byte when the project is empty", () => {
    const resolved = resolveElasticBlocks(pps8StepAuto, [], {}, "en");
    expect(resolved).toEqual(pps8StepAuto.blocks);
  });

  it("reproduces the shipped defaults when every block's demand exactly matches its default", () => {
    const rendererMap: A3EntryRendererMap = {
      fixture: () => ({ lines: linesOf(12) }),
    };
    const template = fixtureElasticTemplate(leftColumnBlocks());
    const entries = [entryWithStep(1)];
    const resolved = resolveElasticBlocks(template, entries, rendererMap, "en");
    // Only ADIM 1 has entries here; ADIM 2/3 stay empty and (per the "nobody
    // else wants it" rule below) stay at their own defaults too.
    expect(resolved).toEqual(template.blocks);
  });

  it("D-160's own worked example: ADIM 2 grows to exactly 33 total rows (31 canvas + 2 header) when ADIM 1 and ADIM 3 both give up their full slack down to floor", () => {
    const rendererMap: A3EntryRendererMap = {
      empty: () => ({ lines: [] }),
      hungry: () => ({ lines: linesOf(100) }),
    };
    const template = fixtureElasticTemplate(leftColumnBlocks());
    const entries = [
      entryWithStep(1, { id: "e1", methodId: "empty" }),
      entryWithStep(2, { id: "e2", methodId: "hungry" }),
      entryWithStep(3, { id: "e3", methodId: "empty" }),
    ];
    const resolved = resolveElasticBlocks(template, entries, rendererMap, "en");

    const [adim1, adim2, adim3] = resolved;
    expect(adim1!.contentRows).toEqual({ start: 6, end: 15 }); // 10 canvas rows (floor)
    expect(adim1!.headerRange).toBe("A4:A5"); // column top never moves
    expect(adim2!.headerRange).toBe("A16:A17"); // shifted up by ADIM 1's 2-row shrink
    expect(adim2!.contentRows).toEqual({ start: 18, end: 48 }); // 31 canvas rows
    expect(adim3!.headerRange).toBe("A49:A50");
    expect(adim3!.contentRows).toEqual({ start: 51, end: 53 }); // 3 canvas rows (floor)

    // The column's own total row count (header + canvas, all three blocks) is invariant.
    const totalRows = resolved.reduce(
      (sum, block) => sum + (block.contentRows.end - block.contentRows.start + 1) + 2,
      0,
    );
    expect(totalRows).toBe(50);
  });

  it("never shrinks a block below its declared minimumCanvasRows, however extreme the neighbouring demand", () => {
    const rendererMap: A3EntryRendererMap = { hungry: () => ({ lines: linesOf(10_000) }) };
    const template = fixtureElasticTemplate(leftColumnBlocks());
    const entries = [entryWithStep(2, { methodId: "hungry" })];
    const resolved = resolveElasticBlocks(template, entries, rendererMap, "en");

    const [adim1, adim2, adim3] = resolved;
    expect(adim1!.contentRows.end - adim1!.contentRows.start + 1).toBe(10); // floor, not 0
    expect(adim3!.contentRows.end - adim3!.contentRows.start + 1).toBe(3); // floor, not 0
    // ADIM 2 absorbs exactly what its two neighbours gave up (2 + 3 = 5), never more.
    expect(adim2!.contentRows.end - adim2!.contentRows.start + 1).toBe(31);
  });

  it("gives an unbounded-demand block (no rowSpan/zonesRowSpan) all of a column's freed surplus", () => {
    const rendererMap: A3EntryRendererMap = {
      empty: () => ({ lines: [] }),
      diagram: () => ({ lines: [], image: { kind: "fishbone-diagram", spec: {} } }),
    };
    const template = fixtureElasticTemplate(leftColumnBlocks());
    const entries = [
      entryWithStep(1, { id: "e1", methodId: "empty" }),
      entryWithStep(2, { id: "e2", methodId: "diagram" }),
      entryWithStep(3, { id: "e3", methodId: "empty" }),
    ];
    const resolved = resolveElasticBlocks(template, entries, rendererMap, "en");
    const adim2 = resolved[1]!;
    expect(adim2.contentRows.end - adim2.contentRows.start + 1).toBe(31); // same ceiling as the finite "hungry" case
  });
});
