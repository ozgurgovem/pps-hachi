import { describe, expect, it } from "vitest";
import { buildA3Layout } from "../../a3/buildA3Layout";
import { farplas7StepTr } from "../../a3/templates/farplas-7step-tr";
import type { ProjectModel, StepState } from "../../domain/model";
import { getA3RendererMap } from "../registry";
import { GAP_STATEMENT_METHOD_ID } from "./index";

/**
 * D-224/D-102: proves the two-zone (no-image) panel survives a real block's
 * geometry end to end through `buildA3Layout` — no rasterization pass is
 * needed here (unlike `smartTarget`'s own survival test) since neither zone
 * carries an `image`, only `lines`/`fillStyleId`.
 */
function emptyStep(): StepState {
  return { entries: [] };
}

function fixtureProject(): ProjectModel {
  return {
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
      language: "en",
      ai: { enabled: false, redaction: {} },
    },
    templateId: "farplas-7step-tr",
    steps: {
      1: {
        entries: [
          {
            id: "gap-statement-entry-1",
            methodId: GAP_STATEMENT_METHOD_ID,
            title: "Leak at final test",
            order: 0,
            a3Visibility: "primary",
            payload: {
              ideal: "Zero leaks",
              actual: "Intermittent leak",
              gap: "3 PPM above ideal",
              gapValue: 3,
              unit: "PPM",
              baselinePeriod: "Q2 2026",
            },
            images: [],
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            provenance: { origin: "human" },
          },
        ],
      },
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
}

describe("gapStatement two-zone panel — buildA3Layout survival (D-224)", () => {
  it("places both zones' text as real cells, tinted with the Layer A band styles, and requests no image", () => {
    const rendererMap = getA3RendererMap();
    const { descriptor, pendingImages } = buildA3Layout(fixtureProject(), farplas7StepTr, { rendererMap });

    expect(pendingImages).toEqual([]);

    const values = descriptor.sheets.a3.cells.map((cell) => cell.value);
    expect(values).toContain("3 PPM above ideal (Q2 2026)");
    expect(values).toContain("Ideal: Zero leaks");

    // "Ideal: Zero leaks" appears twice — once plain in the left (gap-analysis)
    // zone, once tinted in the right (problem-statement) zone — so check that
    // *some* cell with each value carries the expected band style, not just
    // the first match.
    const hasStyledCell = (value: string, styleId: string) =>
      descriptor.sheets.a3.cells.some((cell) => cell.value === value && cell.styleId === styleId);
    expect(hasStyledCell("Ideal: Zero leaks", "bandPositive")).toBe(true);
    expect(hasStyledCell("Actual: Intermittent leak", "bandCaution")).toBe(true);
    expect(hasStyledCell("Gap: 3 PPM above ideal", "bandNegative")).toBe(true);
  });

  it("consumes only its own 8-row zonesRowSpan, leaving the rest of the block free for a later entry", () => {
    const rendererMap = getA3RendererMap();
    const { descriptor } = buildA3Layout(fixtureProject(), farplas7StepTr, { rendererMap });

    // farplas-7step-tr's ADIM 1 block runs rows 8-21 (14 rows). The
    // zonesRowSpan fix means gapStatement's own content never lands past
    // row 15 (start row 8 + 8 - 1).
    const rowsUsed = descriptor.sheets.a3.cells
      .map((cell) => Number(cell.ref.match(/\d+/)?.[0]))
      .filter((row) => row >= 8 && row <= 21);
    expect(Math.max(...rowsUsed)).toBeLessThanOrEqual(15);
  });
});
