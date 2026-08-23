import { describe, expect, it } from "vitest";
import type { ProjectModel, StepState } from "../domain/model";
import { buildA3Layout } from "./buildA3Layout";
import type { A3EntryRendererMap } from "./methodContract";
import { farplas7StepTr } from "./templates/farplas-7step-tr";

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
