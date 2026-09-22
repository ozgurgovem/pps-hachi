import { describe, expect, it } from "vitest";
import type { ProjectModel, StepState } from "../domain/model";
import { buildA3Layout } from "./buildA3Layout";
import type { A3BlockAggregateImageMap, A3EntryRendererMap } from "./methodContract";
import { farplas7StepTr } from "./templates/farplas-7step-tr";
import { pps8StepAuto } from "./templates/pps-8step-auto";

const rendererMap: A3EntryRendererMap = {
  "generic-text": (payload, entry) => {
    const text = (payload as { text: string }).text;
    return { lines: [{ text: entry.title, bold: true }, { text }] };
  },
};

function emptyStep(): StepState {
  return { entries: [] };
}

function fixtureProject(overrides: Partial<ProjectModel> = {}): ProjectModel {
  const base: ProjectModel = {
    id: "fixture-project-id",
    schemaVersion: 1,
    meta: {
      title: "Kapı Panel Gürültü Problemi",
      projectCode: "KZ-2026-014",
      revision: "A",
      department: "Kalite",
      owner: { name: "Ayşe Yılmaz" },
      team: [],
      status: "active",
      openedAt: "2026-01-01T00:00:00.000Z",
      language: "tr",
      ai: { enabled: false, redaction: {} },
    },
    templateId: "farplas-7step-tr",
    steps: {
      1: emptyStep(),
      2: emptyStep(),
      3: emptyStep(),
      4: emptyStep(),
      5: emptyStep(),
      6: emptyStep(),
      7: emptyStep(),
      8: emptyStep(),
    },
    signOff: {
      preparedBy: { name: "Ayşe Yılmaz", signedAt: "2026-01-10T00:00:00.000Z" },
      approvedBy: { name: "Mehmet Kaya", signedAt: "2026-01-12T00:00:00.000Z" },
    },
    rounds: [],
  };
  return { ...base, ...overrides };
}

function fixtureEntry(overrides: Record<string, unknown>) {
  return {
    id: "entry-1",
    methodId: "generic-text",
    title: "Problem Tanımı",
    order: 0,
    a3Visibility: "primary" as const,
    payload: { text: "Ön kapı panelinde gürültü tespit edildi." },
    images: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    provenance: { origin: "human" as const },
    ...overrides,
  };
}

describe("buildA3Layout", () => {
  it("is deterministic across repeated calls with identical inputs", () => {
    const project = fixtureProject({
      steps: {
        ...fixtureProject().steps,
        1: { entries: [fixtureEntry({})] },
      },
    });

    const first = buildA3Layout(project, farplas7StepTr, { rendererMap });
    const second = buildA3Layout(project, farplas7StepTr, { rendererMap });

    expect(first).toEqual(second);
  });

  it("matches the golden-file snapshot for a representative project", () => {
    const project = fixtureProject({
      steps: {
        ...fixtureProject().steps,
        1: { entries: [fixtureEntry({})] },
        3: {
          entries: [
            fixtureEntry({
              id: "target-entry",
              title: "Hedef",
              payload: { text: "Gürültü seviyesini 4 haftada %90 azalt." },
            }),
          ],
        },
      },
    });

    const { descriptor } = buildA3Layout(project, farplas7StepTr, { rendererMap });

    expect(descriptor).toMatchSnapshot();
  });

  it("carries all 46 template merges plus any content merges added during placement", () => {
    const project = fixtureProject();
    const { descriptor } = buildA3Layout(project, farplas7StepTr, { rendererMap });

    const templateMergeCount = farplas7StepTr.merges.length;
    expect(templateMergeCount).toBe(46);
    expect(descriptor.sheets.a3.merges.length).toBeGreaterThanOrEqual(templateMergeCount);
  });

  it("excludes appendix-visibility entries from the A3 sheet and places them in an appendix sheet", () => {
    const project = fixtureProject({
      steps: {
        ...fixtureProject().steps,
        2: {
          entries: [
            fixtureEntry({
              id: "appendix-entry",
              title: "Detaylı Analiz",
              a3Visibility: "appendix",
              payload: { text: "Bu içerik ek olarak taşınmalı." },
            }),
          ],
        },
      },
    });

    const { descriptor } = buildA3Layout(project, farplas7StepTr, { rendererMap });

    const a3CellValues = descriptor.sheets.a3.cells.map((cell) => cell.value);
    expect(a3CellValues).not.toContain("Detaylı Analiz");

    expect(descriptor.sheets.appendices).toHaveLength(1);
    const appendixValues = descriptor.sheets.appendices[0]!.cells.map((cell) => cell.value);
    expect(appendixValues).toContain("Detaylı Analiz");
  });

  it("never silently truncates: entries that overflow a block's budget are dropped from the A3 sheet but still appear in an appendix, with a recorded warning", () => {
    const manyEntries = Array.from({ length: 20 }, (_, i) =>
      fixtureEntry({
        id: `overflow-entry-${i}`,
        title: `Girdi ${i}`,
        order: i,
        payload: { text: `İçerik satırı ${i}` },
      }),
    );

    const project = fixtureProject({
      steps: {
        ...fixtureProject().steps,
        // Step 3 (Target Setting) has the smallest budget in this template: 1 content row.
        3: { entries: manyEntries },
      },
    });

    const { descriptor } = buildA3Layout(project, farplas7StepTr, { rendererMap });

    expect(descriptor.overflowWarnings.length).toBeGreaterThan(0);
    const warning = descriptor.overflowWarnings.find((w) => w.stepIds.includes(3));
    expect(warning).toBeDefined();
    expect(warning!.droppedEntryIds.length).toBeGreaterThan(0);

    const appendixTitles = descriptor.sheets.appendices.flatMap((sheet) =>
      sheet.cells.map((cell) => cell.value),
    );
    for (const droppedId of warning!.droppedEntryIds) {
      const droppedEntry = manyEntries.find((e) => e.id === droppedId)!;
      expect(appendixTitles).toContain(droppedEntry.title);
    }
  });

  it("appendixes a zones-only entry's content instead of producing a blank sheet", () => {
    // Phase 5 review regression: `buildAppendixSheets` read only
    // `content.lines`, so a method whose content lives entirely in `zones`
    // (SMART Target returns `lines: []` by design) appendixed as a
    // completely empty sheet — losing exactly what the appendix exists to
    // preserve (SPEC.md §2.3).
    const zonesRendererMap: A3EntryRendererMap = {
      "smart-target": () => ({
        lines: [],
        zones: [
          { widthFraction: 0.5, lines: [{ text: "Panel rezonansını azalt" }] },
          { widthFraction: 0.5, image: { kind: "trajectory-chart", spec: {} } },
        ],
      }),
    };

    const project = fixtureProject({
      steps: {
        ...fixtureProject().steps,
        3: {
          entries: [
            fixtureEntry({
              id: "zoned-appendix-entry",
              methodId: "smart-target",
              title: "Hedef Kartı",
              a3Visibility: "appendix",
            }),
          ],
        },
      },
    });

    const { descriptor } = buildA3Layout(project, farplas7StepTr, {
      rendererMap: zonesRendererMap,
    });

    expect(descriptor.sheets.appendices).toHaveLength(1);
    const values = descriptor.sheets.appendices[0]!.cells.map((cell) => cell.value);
    expect(values).toContain("Hedef Kartı");
    expect(values).toContain("Panel rezonansını azalt");
  });

  it("resolves header and footer fields from project meta and sign-off", () => {
    const project = fixtureProject();
    const { descriptor } = buildA3Layout(project, farplas7StepTr, { rendererMap });

    const cellByRef = (ref: string) =>
      descriptor.sheets.a3.cells.find((cell) => cell.ref === ref)?.value;

    expect(cellByRef("D2")).toBe("Ayşe Yılmaz"); // champion value
    expect(cellByRef("H2")).toBe("KZ-2026-014"); // kaizen no value
    expect(cellByRef("R2")).toBe("Kalite"); // department value
    // D-96: approval cells are label-only in the source form (no distinct
    // value cell) — signOff is not exported into the sheet yet.
    expect(cellByRef("R59")).toBe("ONAY 1");
    expect(cellByRef("Y59")).toBe("MÜD-YÖN. ONAYI");
  });

  it("marks a block provisional when its step's readiness is flagged, and leaves other blocks unmarked", () => {
    // A `generic-text` entry never satisfies S1's `gap-statement`-specific
    // check (D-196), so Step 1's block is expected to flag — Step 2 stays
    // empty and D-196's "an empty step never flags" rule keeps it unmarked.
    const project = fixtureProject({
      steps: {
        ...fixtureProject().steps,
        1: { entries: [fixtureEntry({})] },
      },
    });

    const { descriptor } = buildA3Layout(project, farplas7StepTr, { rendererMap });

    expect(descriptor.provisionalBlocks).toEqual([{ stepIds: [1], range: "B7:O21" }]);
  });

  it("marks no blocks provisional when every step is empty", () => {
    const { descriptor } = buildA3Layout(fixtureProject(), farplas7StepTr, { rendererMap });

    expect(descriptor.provisionalBlocks).toEqual([]);
  });
});

/**
 * Faz 11/L1 (D-223/D-224): the same `resolveHeaderFieldValue` switch now
 * also serves `pps-8step-auto`'s twelve identity-band fields — a real,
 * template-driven exercise of the new field ids/bilingual dictionaries,
 * not just farplas-7step-tr's original three.
 */
describe("buildA3Layout — pps-8step-auto header identity band (Faz 11/L1)", () => {
  function cellByRef(cells: readonly { ref: string; value: string | number | null }[], ref: string) {
    return cells.find((cell) => cell.ref === ref)?.value;
  }

  it("writes all twelve identity-band field values from project.meta, in Turkish, including the two translated dictionaries", () => {
    const project = fixtureProject({
      templateId: "pps-8step-auto",
      meta: {
        ...fixtureProject().meta,
        projectCode: "PPS-2026-014",
        customer: "Farplas Otomotiv",
        line: "Hat 3",
        priority: "high",
        partNumber: "12345-A",
        targetClosureDate: "2026-12-01",
        generalRag: "amber",
      },
    });

    const { descriptor } = buildA3Layout(project, pps8StepAuto, { rendererMap });
    const cells = descriptor.sheets.a3.cells;

    expect(cellByRef(cells, "B4")).toBe("PPS-2026-014"); // ppsId
    expect(cellByRef(cells, "E4")).toBe("Kapı Panel Gürültü Problemi"); // problemTitle
    expect(cellByRef(cells, "K4")).toBe("Ayşe Yılmaz"); // problemOwner
    expect(cellByRef(cells, "O4")).toBe("Farplas Otomotiv"); // customer
    expect(cellByRef(cells, "R4")).toBe("Hat 3"); // line
    expect(cellByRef(cells, "X4")).toBe("Yüksek"); // priority, Turkish dictionary
    expect(cellByRef(cells, "B5")).toBe("Kalite"); // department
    expect(cellByRef(cells, "E5")).toBe("12345-A"); // partNumber
    expect(cellByRef(cells, "K5")).toBe("2026-01-01"); // openedAt, ISO date only
    expect(cellByRef(cells, "O5")).toBe("A"); // revision
    expect(cellByRef(cells, "R5")).toBe("2026-12-01"); // targetClosureDate
    expect(cellByRef(cells, "X5")).toBe("Sarı"); // generalRag, Turkish dictionary
  });

  it("shows the English dictionary labels for priority/generalRag on an English-language project", () => {
    const project = fixtureProject({
      templateId: "pps-8step-auto",
      meta: { ...fixtureProject().meta, language: "en", priority: "critical", generalRag: "red" },
    });

    const { descriptor } = buildA3Layout(project, pps8StepAuto, { rendererMap });
    const cells = descriptor.sheets.a3.cells;

    expect(cellByRef(cells, "X4")).toBe("Critical"); // priority
    expect(cellByRef(cells, "X5")).toBe("Red"); // generalRag
  });

  it("leaves optional identity-band fields blank rather than writing a value cell when unset", () => {
    const { descriptor } = buildA3Layout(fixtureProject({ templateId: "pps-8step-auto" }), pps8StepAuto, {
      rendererMap,
    });
    const cells = descriptor.sheets.a3.cells;

    // priority/customer/line/partNumber/targetClosureDate/generalRag are all
    // unset in the base fixture — buildA3Layout.ts only pushes a value cell
    // when resolveHeaderFieldValue returns non-empty (see its own `if (value)`).
    expect(cellByRef(cells, "X4")).toBeUndefined(); // priority
    expect(cellByRef(cells, "O4")).toBeUndefined(); // customer
    expect(cellByRef(cells, "R4")).toBeUndefined(); // line
    expect(cellByRef(cells, "X5")).toBeUndefined(); // generalRag
  });
});

/**
 * Faz 11/L3a (D-158/D-160, both LOCKED): end-to-end proof that the elastic
 * solver (`layout/elasticAllocation.ts`) actually reaches the real
 * `buildA3Layout` pipeline — cells land at the *shifted* rows, not the
 * template's static defaults, and the shifted header gets a real merge.
 * `elasticAllocation.test.ts` already proves the arithmetic in isolation;
 * this is the "does the wiring actually happen" check.
 */
describe("buildA3Layout — pps-8step-auto elastic block allocation (Faz 11/L3a)", () => {
  function manyGenericTextEntries(count: number) {
    return Array.from({ length: count }, (_, index) =>
      fixtureEntry({ id: `bulk-${index}`, order: index, payload: { text: `Bulk entry ${index}.` } }),
    );
  }

  it("grows ADIM 2 into ADIM 1 and ADIM 3's floor-shrunk slack — the exact D-160 worked example, through the real pipeline", () => {
    const project = fixtureProject({
      templateId: "pps-8step-auto",
      steps: {
        ...fixtureProject().steps,
        // Empty ADIM 1/3 give up their slack down to their own floors (4
        // and 3 canvas rows); ADIM 2's 20 entries (2 lines each = 40 rows
        // of demand) want far more than its 19-row Rev00 default.
        2: { entries: manyGenericTextEntries(20) },
      },
    });

    const { descriptor } = buildA3Layout(project, pps8StepAuto, { rendererMap });
    const { cells, merges } = descriptor.sheets.a3;

    // ADIM 1 shrinks to its 4-canvas-row floor; its title cell never moves
    // (it is the top of the column), and its guidance strip travels with it
    // on the header's own last row.
    expect(cells.find((cell) => cell.ref === "A7")?.value).toBe("ADIM 1 — PROBLEM TANIMI");
    expect(merges).toContainEqual({ range: "A7:L7" });
    expect(cells.find((cell) => cell.ref === "A8")?.value).toBe(
      "Problemin net tanımı: Ne? Nerede? Ne zaman? Ne kadar?",
    );

    // ADIM 2's header shifts UP from its Rev00 default A16:L17 to A13:L14 —
    // a real merge for the new range must exist (dynamically emitted, since
    // an elastic block's header merge is deliberately absent from the static
    // template.merges list), and its strip moves with it.
    expect(cells.find((cell) => cell.ref === "A13")?.value).toBe("ADIM 2 — PROBLEMİ PARÇALARA AYIRMA");
    expect(merges).toContainEqual({ range: "A13:L13" });
    // Same caveat as the pinned case below: ADIM 2's own content now runs
    // through row 16, and every content line is merged across the block's
    // full width, so assert the header MOVED rather than that the range is
    // absent.
    expect(cells.find((cell) => cell.ref === "A16")?.value).not.toBe("ADIM 2 — PROBLEMİ PARÇALARA AYIRMA");
    expect(cells.find((cell) => cell.ref === "A14")?.value).toBe("Mevcut durum / trend / problem noktası");

    // ADIM 2's content now starts at row 15 (right after its own shifted
    // header), not the Rev00 default of row 18.
    expect(cells.find((cell) => cell.ref === "A15")?.value).toBe("Problem Tanımı");

    // ADIM 3 (still empty) is pushed down to header A39:L40, holding its
    // own 3-canvas-row floor (contentRows 41-43).
    expect(cells.find((cell) => cell.ref === "A39")?.value).toBe("ADIM 3 — HEDEF BELİRLEME");
    expect(merges).toContainEqual({ range: "A39:L39" });

    // 40 rows of demand cannot all fit into the 24-row ceiling ADIM 2 was
    // actually granted — the surplus safely overflows to an appendix
    // (D-100), it is never silently truncated.
    expect(descriptor.overflowWarnings.some((warning) => warning.stepIds.includes(2))).toBe(true);
    expect(descriptor.sheets.appendices.length).toBeGreaterThan(0);
  });

  it("leaves farplas-7step-tr's own header merges exactly as they were — no elastic block declared, no dynamic push", () => {
    const project = fixtureProject({
      steps: { ...fixtureProject().steps, 2: { entries: manyGenericTextEntries(20) } },
    });
    const { descriptor } = buildA3Layout(project, farplas7StepTr, { rendererMap });
    // farplas-7step-tr's own Step 2 header cell/merge never moves regardless
    // of how much content Step 2 carries — this template has no `.elastic`
    // blocks at all (D-223 madde 1's own scope narrowing).
    const step2Block = farplas7StepTr.blocks.find((block) => block.appSteps.includes(2))!;
    expect(descriptor.sheets.a3.merges).toContainEqual({ range: step2Block.headerRange });
  });
});

/**
 * Faz 11/L3b (D-170): end-to-end proof that `project.blockPins` actually
 * reaches the real pipeline — `elasticAllocation.test.ts` already proves the
 * arithmetic in isolation, this is the "does buildA3Layout actually read
 * `project.blockPins` and wire it through" check.
 */
describe("buildA3Layout — pps-8step-auto manual block pins (Faz 11/L3b)", () => {
  it("grows ADIM 1 to its pinned row count, shrinking ADIM 2 toward its own floor, through the real pipeline", () => {
    const project = fixtureProject({
      templateId: "pps-8step-auto",
      blockPins: { 1: 20 },
    });

    const { descriptor } = buildA3Layout(project, pps8StepAuto, { rendererMap });
    const { cells, merges } = descriptor.sheets.a3;

    // ADIM 1's header never moves (top of the column); its own content now
    // spans 20 rows instead of its 7-row Rev00 default.
    expect(cells.find((cell) => cell.ref === "A7")?.value).toBe("ADIM 1 — PROBLEM TANIMI");

    // ADIM 2's header shifts down from its Rev00 default A16:L16 to A29:L29
    // — a real dynamic merge for the shifted range, the old one gone.
    expect(cells.find((cell) => cell.ref === "A29")?.value).toBe("ADIM 2 — PROBLEMİ PARÇALARA AYIRMA");
    expect(merges).toContainEqual({ range: "A29:L29" });
    // The header genuinely MOVED — it is not merely also present at the
    // shifted row. (A bare `not.toContainEqual({ range: "A16:L16" })` would
    // be wrong here: ADIM 1's own content now runs through row 16, and
    // `place.ts` merges every content line across the block's full width,
    // so that exact range legitimately exists for a different reason.)
    expect(cells.find((cell) => cell.ref === "A16")?.value).not.toBe("ADIM 2 — PROBLEMİ PARÇALARA AYIRMA");

    // ADIM 3 (untouched — ADIM 2 alone had enough slack to cover ADIM 1's
    // growth) keeps its own original default header range.
    expect(cells.find((cell) => cell.ref === "A37")?.value).toBe("ADIM 3 — HEDEF BELİRLEME");
    expect(merges).toContainEqual({ range: "A37:L37" });

    // elasticBlocks (the drag-handle overlay's own geometry source) reports
    // ADIM 1's real pin and every left-column block's resolved geometry.
    const adim1Geometry = descriptor.elasticBlocks.find((block) => block.stepIds.includes(1));
    expect(adim1Geometry).toMatchObject({
      contentRows: { start: 9, end: 28 },
      minimumCanvasRows: 4,
      pinnedCanvasRows: 20,
    });
    const adim3Geometry = descriptor.elasticBlocks.find((block) => block.stepIds.includes(3));
    expect(adim3Geometry).toMatchObject({ minimumCanvasRows: 3 });
    expect(adim3Geometry?.pinnedCanvasRows).toBeUndefined();
  });

  it("is a no-op when blockPins is omitted — same geometry as an unpinned project", () => {
    const withoutPins = buildA3Layout(fixtureProject({ templateId: "pps-8step-auto" }), pps8StepAuto, {
      rendererMap,
    });
    const withEmptyPins = buildA3Layout(
      fixtureProject({ templateId: "pps-8step-auto", blockPins: {} }),
      pps8StepAuto,
      { rendererMap },
    );
    expect(withEmptyPins.descriptor.sheets.a3.merges).toEqual(withoutPins.descriptor.sheets.a3.merges);
    expect(withEmptyPins.descriptor.elasticBlocks).toEqual(withoutPins.descriptor.elasticBlocks);
    expect(withoutPins.descriptor.elasticBlocks.every((block) => block.pinnedCanvasRows === undefined)).toBe(true);
  });

  it("reports elasticBlocks as empty for farplas-7step-tr, which declares no `.elastic` blocks at all", () => {
    const { descriptor } = buildA3Layout(fixtureProject({ templateId: "farplas-7step-tr" }), farplas7StepTr, {
      rendererMap,
    });
    expect(descriptor.elasticBlocks).toEqual([]);
  });
});

/**
 * P-22/D-270: `farplas-7step-tr`'s own real Step 5+6 merged block
 * ("P22:AB22" header, `contentRows: { start: 23, end: 35 }`, 13 rows) —
 * `action-item` is a literal methodId string here (the same "domain/a3 stay
 * React-free, duck-type instead of importing `src/methods`" posture
 * `evaluateReadiness.ts`'s own G1 comment already established, D-196), and
 * the renderer/aggregate declaration are hand-built fixtures rather than
 * the real `actionItem` plugin — this suite is testing the MECHANISM
 * `buildA3Layout.ts` now runs, not `action-item`'s own real chart sizing.
 */
describe("buildA3Layout — block-level aggregate images (P-22/D-270)", () => {
  const actionItemRenderer: A3EntryRendererMap = {
    ...rendererMap,
    "action-item": (_payload, entry) => ({ lines: [{ text: entry.title }] }),
  };

  function fixtureAggregateMap(rowSpan: number): A3BlockAggregateImageMap {
    return {
      "action-item": {
        kind: "action-gantt-chart",
        rowSpan,
        buildSpec: (entries) => ({
          kind: "gantt-chart",
          items: entries.map((entry) => ({ id: entry.id, label: entry.title, startDate: "", dueDate: "" })),
        }),
      },
    };
  }

  function projectWithActionItems(entries: readonly Record<string, unknown>[]): ProjectModel {
    return fixtureProject({
      steps: {
        ...fixtureProject().steps,
        6: { entries: entries.map((overrides) => fixtureEntry({ methodId: "action-item", ...overrides })) },
      },
    });
  }

  it("reserves rowSpan rows at the block's own top row and pushes every entry's own text below it", () => {
    const project = projectWithActionItems([
      { id: "a1", order: 0, title: "Kalıp bakımı" },
      { id: "a2", order: 1, title: "Operatör eğitimi" },
    ]);
    const { pendingImages, descriptor } = buildA3Layout(project, farplas7StepTr, {
      rendererMap: actionItemRenderer,
      aggregateImageMap: fixtureAggregateMap(3),
    });

    const ganttSlots = pendingImages.filter((slot) => slot.kind === "action-gantt-chart");
    expect(ganttSlots).toHaveLength(1);
    expect(ganttSlots[0]!.anchorCell).toBe("P23"); // block's own top content row, unshifted
    expect(ganttSlots[0]!.spec).toEqual({
      kind: "gantt-chart",
      items: [
        { id: "a1", label: "Kalıp bakımı", startDate: "", dueDate: "" },
        { id: "a2", label: "Operatör eğitimi", startDate: "", dueDate: "" },
      ],
    });

    // Both entries' own text rows start 3 rows below the block's top (23 + 3 = 26), not at 23.
    const cellRefs = descriptor.sheets.a3.cells.map((cell) => cell.ref);
    expect(cellRefs).toContain("P26");
    expect(cellRefs).toContain("P27");
    expect(cellRefs).not.toContain("P23");
    expect(cellRefs).not.toContain("P24");
    expect(cellRefs).not.toContain("P25");
  });

  it("emits no aggregate image at all when aggregateImageMap is omitted — pre-P-22 callers (e.g. scripts/gen-a3-fixture.ts) are unaffected", () => {
    const project = projectWithActionItems([{ id: "a1", order: 0, title: "Kalıp bakımı" }]);
    const { pendingImages, descriptor } = buildA3Layout(project, farplas7StepTr, {
      rendererMap: actionItemRenderer,
    });

    expect(pendingImages.some((slot) => slot.kind === "action-gantt-chart")).toBe(false);
    // No rows reserved — the entry's own text lands right at the block's top row.
    expect(descriptor.sheets.a3.cells.some((cell) => cell.ref === "P23" && cell.value === "Kalıp bakımı")).toBe(
      true,
    );
  });

  it("never emits an aggregate image for a block with zero entries of the declaring methodId, even though the map covers it", () => {
    const project = fixtureProject(); // every step empty
    const { pendingImages } = buildA3Layout(project, farplas7StepTr, {
      rendererMap: actionItemRenderer,
      aggregateImageMap: fixtureAggregateMap(3),
    });
    expect(pendingImages.some((slot) => slot.kind === "action-gantt-chart")).toBe(false);
  });

  it("builds the chart's spec only from entries that actually survived placement — an entry dropped to the appendix never gets a bar", () => {
    // rowSpan 12 of the block's 13 content rows leaves exactly 1 row for
    // text: the first (lowest `order`) one-line action fits, the second
    // overflows to its own appendix sheet (D-100).
    const project = projectWithActionItems([
      { id: "a1", order: 0, title: "Fits" },
      { id: "a2", order: 1, title: "Overflows" },
    ]);
    const { pendingImages, descriptor } = buildA3Layout(project, farplas7StepTr, {
      rendererMap: actionItemRenderer,
      aggregateImageMap: fixtureAggregateMap(12),
    });

    const ganttSlot = pendingImages.find((slot) => slot.kind === "action-gantt-chart");
    expect(ganttSlot?.spec).toEqual({
      kind: "gantt-chart",
      items: [{ id: "a1", label: "Fits", startDate: "", dueDate: "" }],
    });

    expect(descriptor.overflowWarnings.some((warning) => warning.droppedEntryIds.includes("a2"))).toBe(true);
    expect(descriptor.sheets.appendices.some((sheet) => sheet.cells.some((cell) => cell.value === "Overflows"))).toBe(
      true,
    );
  });
});
