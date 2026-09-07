import { describe, expect, it } from "vitest";
import { buildA3Layout } from "./buildA3Layout";
import { pps8StepAuto } from "./templates/pps-8step-auto";
import type { Entry, ProjectModel, StepState } from "../domain/model";
import { getA3RendererMap } from "../methods/registry";
import { FIVE_N1K_METHOD_ID } from "../methods/fiveN1K/index";
import { GAP_STATEMENT_METHOD_ID } from "../methods/gapStatement/index";

/**
 * Faz 11/L1 (D-223/D-224) PROBE: D-159's own "exact fit, no slack" design
 * puts BOTH `fiveN1K` (4 rows) and `gapStatement` (8 rows) in ADIM 1's same
 * 12-canvas-row block. Before D-224's fix, `place.ts`/`placeZones.ts`
 * treated any zoned entry as consuming the *whole* rest of the block —
 * whichever of the two was placed second would have silently dropped to
 * the appendix, in either order. This exercises the real registry against
 * the real template, both orders, the same discipline `p25TwoImageEntries
 * .probe.test.ts` used for the analogous Step 2 finding.
 */
function emptyStep(): StepState {
  return { entries: [] };
}

function fiveN1kEntry(order: number): Entry {
  return {
    id: "five-n1k-entry-1",
    methodId: FIVE_N1K_METHOD_ID,
    title: "5N1K",
    order,
    a3Visibility: "primary" as const,
    payload: { ne: "Gürültü", neden: "", nasil: "", kim: "", neZaman: "", nerede: "" },
    images: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    provenance: { origin: "human" as const },
  };
}

function gapStatementEntry(order: number): Entry {
  return {
    id: "gap-statement-entry-1",
    methodId: GAP_STATEMENT_METHOD_ID,
    title: "Leak at final test",
    order,
    a3Visibility: "primary" as const,
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
    provenance: { origin: "human" as const },
  };
}

function fixtureProject(step1Entries: Entry[]): ProjectModel {
  return {
    id: "fixture-project-id",
    schemaVersion: 1,
    meta: {
      title: "Kapı Panel Gürültü Problemi",
      projectCode: "PPS-2026-014",
      revision: "A",
      owner: { name: "Ayşe Yılmaz" },
      team: [],
      status: "active",
      openedAt: "2026-01-01T00:00:00.000Z",
      language: "en",
      ai: { enabled: false, redaction: {} },
    },
    templateId: "pps-8step-auto",
    steps: {
      1: { entries: step1Entries },
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

describe("Faz 11/L1 D-224 PROBE — fiveN1K + gapStatement coexist in ADIM 1's one block", () => {
  it("places both entries and drops neither when fiveN1K is entered first", () => {
    const rendererMap = getA3RendererMap();
    const project = fixtureProject([fiveN1kEntry(0), gapStatementEntry(1)]);
    const { descriptor } = buildA3Layout(project, pps8StepAuto, { rendererMap });

    expect(descriptor.overflowWarnings).toEqual([]);
    const values = descriptor.sheets.a3.cells.map((cell) => cell.value);
    expect(values).toContain("WHAT?"); // fiveN1K's own label
    expect(values.some((v) => typeof v === "string" && v.includes("Leak at final test"))).toBe(true);
  });

  it("places both entries and drops neither when gapStatement is entered first (the reverse order)", () => {
    const rendererMap = getA3RendererMap();
    const project = fixtureProject([gapStatementEntry(0), fiveN1kEntry(1)]);
    const { descriptor } = buildA3Layout(project, pps8StepAuto, { rendererMap });

    expect(descriptor.overflowWarnings).toEqual([]);
    const values = descriptor.sheets.a3.cells.map((cell) => cell.value);
    expect(values).toContain("WHAT?");
    expect(values.some((v) => typeof v === "string" && v.includes("Leak at final test"))).toBe(true);
  });

  it("keeps both entries' cells within ADIM 1's own 6-17 row range and does not overflow into ADIM 2", () => {
    const rendererMap = getA3RendererMap();
    const project = fixtureProject([fiveN1kEntry(0), gapStatementEntry(1)]);
    const { descriptor } = buildA3Layout(project, pps8StepAuto, { rendererMap });

    const adim1Cells = descriptor.sheets.a3.cells.filter((cell) => {
      const row = Number(cell.ref.match(/\d+/)?.[0]);
      const col = cell.ref.match(/^[A-Z]+/)?.[0] ?? "";
      return row >= 6 && row <= 17 && col <= "L";
    });
    // fiveN1K's 6 labels + gapStatement's zone lines should all be present.
    expect(adim1Cells.length).toBeGreaterThan(0);
    // Nothing from either entry should have leaked into ADIM 2's header row (18).
    const row18Cells = descriptor.sheets.a3.cells.filter((cell) => cell.ref.endsWith("18") && cell.ref <= "L18");
    expect(row18Cells.every((cell) => cell.value === "ADIM 2. PROBLEMİ PARÇALARA AYIRIN")).toBe(true);
  });
});
