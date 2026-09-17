import { describe, expect, it } from "vitest";
import { buildA3Layout } from "./buildA3Layout";
import { pps8StepAuto } from "./templates/pps-8step-auto";
import type { Entry, ProjectModel, StepState } from "../domain/model";
import { getA3RendererMap } from "../methods/registry";
import { FIVE_N1K_METHOD_ID } from "../methods/fiveN1K/index";
import { GAP_STATEMENT_METHOD_ID } from "../methods/gapStatement/index";

/**
 * Faz 11/L1 (D-223/D-224) PROBE, rewritten for the ADIM 1 BVVL round
 * (2026-09-16/17): originally proved D-224's `zonesRowSpan` fix — before
 * it, any zoned entry silently consumed the *whole* rest of its block,
 * dropping whichever of `fiveN1K`/`gapStatement` was placed second. Both
 * methods have since moved off `zones` entirely (D-224's own mechanism
 * stays valid for `smartTarget`, its only remaining user) onto their own
 * `image` (`five-n1k-diagram`/`gap-analysis-chart`, BVVL round). The
 * *shape* of the original failure this probe guards against — two entries
 * sharing one block, order-independent, neither silently dropped — is
 * still a real risk under the new mechanism too (`place.ts`'s own
 * `lines`+`image` row accounting per entry), so the probe is kept, not
 * retired, with its assertions updated to the two images it now expects.
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
      idealValue: 0,
      actualValue: 3,
      targetDate: "Q3 2026",
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
    const { descriptor, pendingImages } = buildA3Layout(project, pps8StepAuto, { rendererMap });

    expect(descriptor.overflowWarnings).toEqual([]);
    const kinds = pendingImages.map((slot) => slot.kind);
    expect(kinds).toContain("five-n1k-diagram");
    expect(kinds).toContain("gap-analysis-chart");
  });

  it("places both entries and drops neither when gapStatement is entered first (the reverse order)", () => {
    const rendererMap = getA3RendererMap();
    const project = fixtureProject([gapStatementEntry(0), fiveN1kEntry(1)]);
    const { descriptor, pendingImages } = buildA3Layout(project, pps8StepAuto, { rendererMap });

    expect(descriptor.overflowWarnings).toEqual([]);
    const kinds = pendingImages.map((slot) => slot.kind);
    expect(kinds).toContain("five-n1k-diagram");
    expect(kinds).toContain("gap-analysis-chart");
  });

  it("keeps both entries' image anchors inside ADIM 1's own block, never past ADIM 2's own (possibly elastic-shifted) header row", () => {
    const rendererMap = getA3RendererMap();
    const project = fixtureProject([fiveN1kEntry(0), gapStatementEntry(1)]);
    const { descriptor, pendingImages } = buildA3Layout(project, pps8StepAuto, { rendererMap });

    expect(pendingImages).toHaveLength(2);

    // ADIM 1's own default 12-row block, plus both entries' combined
    // 22-row demand, forces real elastic growth (D-158/D-160) — ADIM 2's
    // own header genuinely moves down from its static row 18, so the
    // header is located by its own text, never a hardcoded row number
    // (a hardcoded "row 18" check would pass vacuously once the header
    // moves, matching zero cells rather than catching a real overlap).
    const adim2HeaderCell = descriptor.sheets.a3.cells.find(
      (cell) => cell.value === "ADIM 2. PROBLEMİ PARÇALARA AYIRIN",
    );
    expect(adim2HeaderCell).toBeDefined();
    const adim2HeaderRow = Number(adim2HeaderCell!.ref.match(/\d+/)![0]);

    for (const slot of pendingImages) {
      const row = Number(slot.anchorCell.match(/\d+/)?.[0]);
      const col = slot.anchorCell.match(/^[A-Z]+/)?.[0] ?? "";
      const rowSpanCount = slot.heightPt / 13; // pps-8step-auto's uniform 13pt canvas row
      expect(row).toBeGreaterThanOrEqual(6);
      expect(col <= "L").toBe(true);
      // The image's own last occupied row must sit strictly above ADIM 2's header, wherever it landed.
      expect(row + rowSpanCount - 1).toBeLessThan(adim2HeaderRow);
    }
  });
});
