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

  it("puts the photo BESIDE the charts, not under them, all three sharing the block's width", () => {
    const { pendingImages } = buildA3Layout(fixtureProject(), pps8StepAuto, {
      rendererMap: getA3RendererMap(),
      aggregateImageMap: getA3BlockAggregateImageMap(),
    });

    const photo = pendingImages.find((slot) => slot.kind === "asset-photo")!;
    expect(photo).toBeDefined();

    // Barış, 2026-09-24: "her yeni gelen bilginin yatayda yerleştirilmesi".
    // All three get an equal share of the block, and none is stacked under
    // another — a stacked entry was letterboxed into a wide, short box.
    const widths = pendingImages.map((slot) => Math.round(slot.widthPt));
    expect(new Set(widths).size, `equal shares, got ${widths.join("/")}`).toBe(1);

    const columns = pendingImages.map((slot) => slot.anchorCell.match(/^[A-Z]+/)![0]);
    expect(new Set(columns).size, "each entry starts in its own column").toBe(3);

    // The photo carries a caption line, so its image starts one row lower —
    // but it ends level with the charts rather than below them.
    const ROW_HEIGHT_PT = pps8StepAuto.bodyRowHeightPt;
    const bottomOf = (slot: (typeof pendingImages)[number]) =>
      Number(slot.anchorCell.match(/\d+/)![0]) * ROW_HEIGHT_PT + slot.heightPt;
    const bottoms = pendingImages.map(bottomOf);
    expect(Math.max(...bottoms) - Math.min(...bottoms)).toBeLessThanOrEqual(1);
  });

  it("shrinks ADIM 1 to the height its content actually needs, freeing rows for the steps below", () => {
    const { descriptor } = buildA3Layout(fixtureProject(), pps8StepAuto, {
      rendererMap: getA3RendererMap(),
      aggregateImageMap: getA3BlockAggregateImageMap(),
    });
    const adim1 = descriptor.elasticBlocks.find((block) => block.stepIds.includes(1))!;
    const rows = adim1.contentRows.end - adim1.contentRows.start + 1;

    // The left column has 31 canvas rows to share. Stacked, ADIM 1 took all
    // of them; side by side it needs far fewer, and ADIM 2 starts earlier.
    expect(rows).toBeLessThan(20);
    const adim2 = descriptor.elasticBlocks.find((block) => block.stepIds.includes(2))!;
    expect(adim2.contentRows.start).toBeLessThan(28);
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
