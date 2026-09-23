import { describe, expect, it } from "vitest";
import { buildA3Layout } from "./buildA3Layout";
import { pps8StepAuto } from "./templates/pps-8step-auto";
import type { Entry, ProjectModel, StepState } from "../domain/model";
import { getA3BlockAggregateImageMap, getA3RendererMap } from "../methods/registry";
import { FIVE_N1K_METHOD_ID } from "../methods/fiveN1K/index";
import { GAP_STATEMENT_METHOD_ID } from "../methods/gapStatement/index";

/**
 * PROBE (D-285) — Barış, 2026-09-23: "Fotoğraf ekledim ama bu foto birincil
 * olmasına rağmen Adım 1 alanına gelmedi."
 *
 * Reproduced through the real pipeline before it was fixed: ADIM 1's two
 * side-by-side charts declare no `rowSpan`, so placement handed them every
 * row the block had, and the third entry was dropped to an appendix. The
 * photo was never the special case — ANY third entry on that step hit it.
 *
 * Deliberately the real registry and the real template, not stubs: the bug
 * lived in how three real renderers' declarations interact, which a stub
 * renderer would have hidden.
 */
const empty = (): StepState => ({ entries: [] });
const base = {
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  provenance: { origin: "human" as const },
  a3Visibility: "primary" as const,
};

function fixtureProject(): ProjectModel {
  const gap: Entry = {
    id: "e-gap",
    methodId: GAP_STATEMENT_METHOD_ID,
    title: "Boşluk ifadesi",
    order: 0,
    images: [],
    payload: {
      ideal: "Fire oranının %3'ün altında olması.",
      actual: "Fire oranı %18,3",
      gap: "Hedeften %15,3 sapma.",
      gapValue: 15.3,
      unit: "%",
      baselinePeriod: "W36",
      idealValue: 3,
      actualValue: 18.3,
      targetDate: "W42",
    },
    ...base,
  };
  const fiveN1k: Entry = {
    id: "e-5n1k",
    methodId: FIVE_N1K_METHOD_ID,
    title: "5N1K",
    order: 1,
    images: [],
    payload: {
      ne: "EK-5453 Kalıbı Fireleri",
      neden: "Görsel problemler",
      nasil: "%18,3 seviyesinde",
      nerede: "E-92 enjeksiyon",
      neZaman: "Proses sonrası",
      kim: "Operatör",
    },
    ...base,
  };
  const photo: Entry = {
    id: "e-photo",
    methodId: "defect-photo-board",
    title: "Çapak hatası",
    order: 2,
    payload: {},
    images: [{ id: "img-1", assetPath: "assets/img_1.jpg", thumbnailPath: "assets/thumb_1.jpg" }],
    ...base,
  };

  return {
    id: "p",
    schemaVersion: 1,
    meta: {
      title: "Deneme",
      projectCode: "P",
      revision: "A",
      owner: { name: "B" },
      team: [],
      status: "active",
      openedAt: "2026-01-01T00:00:00.000Z",
      language: "tr",
      ai: { enabled: false, redaction: {} },
    },
    templateId: "pps-8step-auto",
    steps: {
      1: { entries: [gap, fiveN1k, photo] },
      2: empty(),
      3: empty(),
      4: empty(),
      5: empty(),
      6: empty(),
      7: empty(),
      8: empty(),
    },
    signOff: {},
    rounds: [],
  } as unknown as ProjectModel;
}

describe("PROBE (D-285) — a third primary entry on ADIM 1 is placed, not dropped", () => {
  it("places all three entries on the sheet, with no overflow and no appendix", () => {
    const { descriptor, pendingImages } = buildA3Layout(fixtureProject(), pps8StepAuto, {
      rendererMap: getA3RendererMap(),
      aggregateImageMap: getA3BlockAggregateImageMap(),
    });

    expect(descriptor.overflowWarnings).toEqual([]);
    expect(descriptor.sheets.appendices).toHaveLength(0);

    const kinds = pendingImages.map((slot) => slot.kind);
    expect(kinds).toContain("gap-analysis-chart");
    expect(kinds).toContain("five-n1k-diagram");
    expect(kinds, "the photo marked Birincil must reach the sheet").toContain("asset-photo");
  });

  it("gives the photo its own rows below the two side-by-side charts, at the block's full width", () => {
    const { pendingImages } = buildA3Layout(fixtureProject(), pps8StepAuto, {
      rendererMap: getA3RendererMap(),
      aggregateImageMap: getA3BlockAggregateImageMap(),
    });

    const charts = pendingImages.filter((slot) => slot.kind !== "asset-photo");
    const photo = pendingImages.find((slot) => slot.kind === "asset-photo")!;
    expect(photo).toBeDefined();

    const chartRow = Number(charts[0]!.anchorCell.match(/\d+/)![0]);
    const photoRow = Number(photo.anchorCell.match(/\d+/)![0]);
    expect(photoRow, "the photo sits below the charts, not on top of them").toBeGreaterThan(chartRow);

    // The charts share the block's width between them; the photo gets it all.
    expect(photo.widthPt).toBeCloseTo(charts[0]!.widthPt * 2, 0);
    expect(photo.heightPt).toBeGreaterThan(0);
  });

  it("still leaves the two charts the larger share — the photo does not squeeze them out", () => {
    const { pendingImages } = buildA3Layout(fixtureProject(), pps8StepAuto, {
      rendererMap: getA3RendererMap(),
      aggregateImageMap: getA3BlockAggregateImageMap(),
    });
    const chart = pendingImages.find((slot) => slot.kind === "gap-analysis-chart")!;
    const photo = pendingImages.find((slot) => slot.kind === "asset-photo")!;
    expect(chart.heightPt).toBeGreaterThan(photo.heightPt);
  });
});
