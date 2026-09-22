import { describe, expect, it } from "vitest";
import { buildA3Layout } from "./buildA3Layout";
import { pps8StepAuto } from "./templates/pps-8step-auto";
import type { Entry, ProjectModel, StepState } from "../domain/model";
import { getA3RendererMap } from "../methods/registry";
import { FIVE_N1K_METHOD_ID } from "../methods/fiveN1K/index";
import { GAP_STATEMENT_METHOD_ID } from "../methods/gapStatement/index";

/**
 * Faz 11/L1 (D-223/D-224) PROBE, rewritten three times since: first for the
 * ADIM 1 BVVL round (2026-09-16/17, `zones` → each own `image`, stacked,
 * summing to the block's default 12 rows), then for the ADIM 1 side-by-side
 * round (2026-09-17, `docs/oturumlar/adim1-yan-yana-yerlesim.md` — both
 * entries declare `A3BlockContent.widthFraction: 0.5` and sit next to each
 * other via `place.ts`'s `groupIntoRuns`), then again for round 7
 * (2026-09-17, Barış's own live block preview screenshot): a fixed
 * `rowSpan: 12` on each image kept them pinned to the block's own STATIC
 * default even once elastic growth (Faz 11/L3a) pushed the real block far
 * past it — `rowSpan` is now omitted on both, so each grows with the
 * block's own real, post-elastic height. With empty ADIM 2/3 (this
 * fixture's own shape), that means ADIM 1 genuinely DOES grow now — the
 * opposite of the side-by-side round's own "no elastic growth needed"
 * finding, which was specific to the old fixed-12 design. The *shape* of
 * the original failure this probe guards against — two entries sharing one
 * block, order-independent, neither silently dropped — is still checked;
 * the third test now also proves the two images grow together, filling the
 * real (elastic-grown) block instead of staying pinned to the old default.
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

  it("places both entries SIDE BY SIDE, same start row and non-overlapping columns, and GROWS them together with the block's own real elastic height", () => {
    const rendererMap = getA3RendererMap();
    const project = fixtureProject([fiveN1kEntry(0), gapStatementEntry(1)]);
    const { descriptor, pendingImages } = buildA3Layout(project, pps8StepAuto, { rendererMap });

    expect(pendingImages).toHaveLength(2);

    // Round 7's own real fix: with `rowSpan` omitted, both entries report
    // infinite row demand, so ADIM 1 genuinely grows past its own static
    // default (12) once its empty neighbours (this fixture's own shape)
    // have nothing to compete with it for — the header must have moved
    // past the template's own static default (row 20, since the 2026-09-20
    // identity-band correction shifted every block row by +2), proving real
    // elastic growth happened (never asserted as a specific row: the exact
    // target depends on the solver's own arithmetic, which is
    // `resolveElasticBlocks.test.ts`'s job to pin, not this probe's).
    const adim2HeaderCell = descriptor.sheets.a3.cells.find(
      (cell) => cell.value === "ADIM 2 — PROBLEMİ PARÇALARA AYIRMA",
    );
    expect(adim2HeaderCell).toBeDefined();
    const adim2HeaderRow = Number(adim2HeaderCell!.ref.match(/\d+/)![0]);
    expect(adim2HeaderRow).toBeGreaterThan(20);

    const geometry = pendingImages.map((slot) => ({
      kind: slot.kind,
      row: Number(slot.anchorCell.match(/\d+/)?.[0]),
      col: slot.anchorCell.match(/^[A-Z]+/)?.[0] ?? "",
      widthPt: slot.widthPt,
      heightPt: slot.heightPt,
    }));

    // Both start at the block's own first content row (9 — Rev00's ADIM 1
    // spends rows 7-8 on its title and guidance strip) — neither is stacked
    // below the other.
    for (const slot of geometry) {
      expect(slot.row).toBe(9);
    }

    // Together they span the block's real 12-column width (A:L, 495pt) in
    // two equal, non-overlapping halves — 6 columns (247.5pt) each, not
    // the pre-side-by-side full 495pt a stacked entry would have gotten.
    const columns = geometry.map((slot) => slot.col).sort();
    expect(columns).toEqual(["A", "G"]);
    for (const slot of geometry) {
      expect(slot.widthPt).toBeCloseTo(247.5, 1);
    }

    // Both images grow to the SAME real block height (13pt/row × however
    // many rows the block actually resolved to) — well past the old
    // static 12-row/156pt ceiling, and identical to each other since they
    // share one row band.
    expect(geometry[0]!.heightPt).toBeCloseTo(geometry[1]!.heightPt, 5);
    expect(geometry[0]!.heightPt).toBeGreaterThan(12 * 13);
  });
});
