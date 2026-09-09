import { describe, expect, it } from "vitest";
import { buildA3Layout } from "../../a3/buildA3Layout";
import { pps8StepAuto } from "../../a3/templates/pps-8step-auto";
import type { ProjectModel, StepState } from "../../domain/model";
import { GENERIC_TEXT_METHOD_ID } from "../genericText";
import { getA3RendererMap } from "../registry";
import { KPI_STRIP_METHOD_ID } from "./index";

/**
 * P-63's own regression test, per `docs/oturumlar/kucuk-acik-maddeler.md`
 * §1.3: a `kpi-strip` entry must no longer drop to an appendix on
 * `pps-8step-auto`'s real ADIM 7 canvas (`contentRows: { start: 42, end: 47
 * }` — exactly 6 rows, D-158/§12.8), proven through the real `buildA3Layout`
 * pipeline, not a mock (D-97's own structural-comparison discipline).
 *
 * ADIM 7 is `elastic` (Faz 11/L3a, D-158/D-160), sharing ONE column-wide
 * solver group with ADIM 4/5/6/8 (all five right-column blocks, N:Y) — a
 * block whose demand exceeds its own default can grow by borrowing spare
 * rows an *empty* neighbour would otherwise give up (`distributeElasticColumn`,
 * `src/a3/layout/elasticAllocation.ts`). That mechanism landed *after* P-63
 * was first found (D-224) and, left unaccounted for, would mask the exact
 * bug this test targets: mutation-checked while writing this test, leaving
 * ADIM 4/5 empty let the old 7-row demand (1 title line + `CHART_ROW_SPAN`
 * 6) get rescued by a row borrowed from ADIM 4's own generous 18→12 slack
 * (giveable 6) — passing whether or not the fix was applied, a false
 * negative this project's own "mutation-verify every green test" discipline
 * exists to catch. So ALL FOUR of ADIM 7's right-column neighbours (4, 5, 6,
 * 8) are deliberately filled to *exactly* their own default row count here
 * (18, 6, 6, 4 respectively — every one a `generic-text` entry whose
 * title+body line count is hand-counted, not estimated), leaving zero rows
 * anywhere in the column for ADIM 7 to borrow. Only the demand fix itself
 * (not elastic luck) can make the kpi-strip entry fit under this condition —
 * confirmed by temporarily reverting the fix and watching this test go RED.
 */
function emptyStep(): StepState {
  return { entries: [] };
}

function genericTextEntry(id: string, title: string, bodyLineCount: number): StepState["entries"][number] {
  const bodyLines = Array.from({ length: bodyLineCount }, () => "x").join("\n");
  return {
    id,
    methodId: GENERIC_TEXT_METHOD_ID,
    title,
    order: 0,
    a3Visibility: "primary",
    payload: { text: bodyLines },
    images: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    provenance: { origin: "human" },
  };
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
      language: "tr",
      ai: { enabled: false, redaction: {} },
    },
    templateId: "pps-8step-auto",
    steps: {
      1: emptyStep(),
      2: emptyStep(),
      3: emptyStep(),
      // ADIM 4 default is 18 canvas rows (minimum 12) — 1 title line + 17
      // body lines saturates it exactly, the single largest slack source in
      // ADIM 7's own column group if left empty.
      4: { entries: [genericTextEntry("root-cause-1", "Kök Neden Analizi", 17)] },
      // ADIM 5 default is 6 canvas rows (minimum 4) — 1 title line + 5 body
      // lines saturates it exactly.
      5: { entries: [genericTextEntry("countermeasure-1", "Uygulama Planı", 5)] },
      // ADIM 6 default is 6 canvas rows (minimum 4) — 1 title line + 5 body
      // lines saturates it exactly, leaving nothing for ADIM 7 to borrow.
      6: { entries: [genericTextEntry("action-item-1", "Eylem Planı", 5)] },
      7: {
        entries: [
          {
            id: "kpi-strip-entry-1",
            methodId: KPI_STRIP_METHOD_ID,
            title: "ADIM 7 KPI izleme",
            order: 0,
            a3Visibility: "primary",
            payload: {
              items: [
                {
                  id: "i1",
                  label: "Çapak Fire Oranı",
                  unit: "%",
                  baseline: 4.2,
                  target: 1.0,
                  actual: 2.1,
                  sustain: undefined,
                  result: undefined,
                  status: "inProgress",
                },
              ],
            },
            images: [],
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            provenance: { origin: "human" },
          },
        ],
      },
      // ADIM 8 default is 4 canvas rows (minimum 3) — 1 title line + 3 body
      // lines saturates it exactly, same reasoning as ADIM 6 above.
      8: { entries: [genericTextEntry("document-updates-1", "Standart Güncelleme", 3)] },
    },
    signOff: {},
    rounds: [],
  };
}

describe("kpi-strip fits pps-8step-auto's real 6-row ADIM 7 canvas (P-63)", () => {
  it("does not drop the kpi-strip entry even when neighbouring elastic blocks have zero spare rows to lend", () => {
    const rendererMap = getA3RendererMap();
    const { descriptor, pendingImages } = buildA3Layout(fixtureProject(), pps8StepAuto, { rendererMap });

    const droppedEntryIds = descriptor.overflowWarnings.flatMap((warning) => warning.droppedEntryIds);
    expect(droppedEntryIds).not.toContain("kpi-strip-entry-1");
    expect(droppedEntryIds).not.toContain("root-cause-1");
    expect(droppedEntryIds).not.toContain("countermeasure-1");
    expect(droppedEntryIds).not.toContain("action-item-1");
    expect(droppedEntryIds).not.toContain("document-updates-1");

    const kpiSlot = pendingImages.find((slot) => slot.entryId === "kpi-strip-entry-1");
    expect(kpiSlot).toBeDefined();
    expect(kpiSlot!.heightPt).toBeGreaterThan(0);
  });
});
