import { describe, expect, it } from "vitest";
import type { ProjectModel, StepId, StepState } from "../../domain/model";
import { buildA3Layout } from "../buildA3Layout";
import type { A3EntryRendererMap } from "../methodContract";
import { farplas7StepTr } from "../templates/farplas-7step-tr";
import { pps8StepAuto } from "../templates/pps-8step-auto";
import { blockRectForStep } from "./blockRectForStep";
import { columnOffsetPx, columnWidthPx, rowHeightPx, rowOffsetPx } from "./gridGeometry";

const ALL_STEP_IDS: readonly StepId[] = [1, 2, 3, 4, 5, 6, 7, 8];

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
    signOff: {},
    rounds: [],
  };
  return { ...base, ...overrides };
}

describe("blockRectForStep", () => {
  it("computes a static template block's rectangle from its header-through-last-content-row range", () => {
    const { descriptor } = buildA3Layout(fixtureProject(), farplas7StepTr, { rendererMap });
    const sheet = descriptor.sheets.a3;
    // farplas-7step-tr's own Step 4 block (src/a3/templates/farplas-7step-tr.ts):
    // headerRange "P7:AB7", contentColumns P:AB, contentRows 8-21.
    const expectedLeft = columnOffsetPx(sheet, "P", 1)!;
    const expectedTop = rowOffsetPx(sheet, 7, 1)!;
    const expectedRight = columnOffsetPx(sheet, "AB", 1)! + columnWidthPx(sheet, "AB", 1)!;
    const expectedBottom = rowOffsetPx(sheet, 21, 1)! + rowHeightPx(sheet, 21, 1)!;

    const rect = blockRectForStep(descriptor, 4);

    expect(rect).toEqual({
      leftPx: expectedLeft,
      topPx: expectedTop,
      widthPx: expectedRight - expectedLeft,
      heightPx: expectedBottom - expectedTop,
    });
  });

  it("returns a rectangle for every one of the 8 steps of a static template", () => {
    const { descriptor } = buildA3Layout(fixtureProject(), farplas7StepTr, { rendererMap });
    for (const stepId of ALL_STEP_IDS) {
      expect(blockRectForStep(descriptor, stepId)).toBeDefined();
    }
  });

  it("returns a rectangle for every one of the 8 steps of the elastic pps-8step-auto template", () => {
    const { descriptor } = buildA3Layout(fixtureProject({ templateId: "pps-8step-auto" }), pps8StepAuto, {
      rendererMap,
    });
    for (const stepId of ALL_STEP_IDS) {
      expect(blockRectForStep(descriptor, stepId)).toBeDefined();
    }
  });

  it("reads the RESOLVED elastic geometry (descriptor.elasticBlocks), never the template's own static default", () => {
    const { descriptor } = buildA3Layout(fixtureProject({ templateId: "pps-8step-auto" }), pps8StepAuto, {
      rendererMap,
    });
    const sheet = descriptor.sheets.a3;
    const elastic = descriptor.elasticBlocks.find((block) => block.stepIds.includes(2));
    expect(elastic).toBeDefined();

    const expectedLeft = columnOffsetPx(sheet, elastic!.contentColumns.first, 1)!;
    const expectedRight =
      columnOffsetPx(sheet, elastic!.contentColumns.last, 1)! + columnWidthPx(sheet, elastic!.contentColumns.last, 1)!;
    const expectedTop = rowOffsetPx(sheet, headerStartRowOf(elastic!), 1)!;
    const expectedBottom =
      rowOffsetPx(sheet, elastic!.contentRows.end, 1)! + rowHeightPx(sheet, elastic!.contentRows.end, 1)!;

    const rect = blockRectForStep(descriptor, 2);

    expect(rect).toEqual({
      leftPx: expectedLeft,
      topPx: expectedTop,
      widthPx: expectedRight - expectedLeft,
      heightPx: expectedBottom - expectedTop,
    });
  });
});

function headerStartRowOf(elastic: { readonly headerRange: string }): number {
  const [start] = elastic.headerRange.split(":");
  const match = /^[A-Z]+(\d+)$/.exec(start ?? "");
  return match ? Number(match[1]) : 0;
}
