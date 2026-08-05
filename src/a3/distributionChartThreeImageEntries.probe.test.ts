import { describe, expect, it } from "vitest";
import { buildA3Layout } from "./buildA3Layout";
import { farplas7StepTr } from "./templates/farplas-7step-tr";
import type { ProjectModel, StepState } from "../domain/model";
import { getA3RendererMap } from "../methods/registry";
import { DISTRIBUTION_CHART_METHOD_ID } from "../methods/distributionChart/index";
import { PARETO_METHOD_ID } from "../methods/pareto/index";
import { TREND_METHOD_ID } from "../methods/trend/index";

/**
 * Phase 6c PROBE: this slice's new mechanism (Step 2's distribution chart)
 * touches exactly the layer D-105/D-107/D-111/D-136 already found real bugs
 * in — `place.ts`'s per-block image-row-span reservation and the pending-
 * image pipeline `rasterize.ts` feeds. `p25TwoImageEntries.probe.test.ts`
 * proved 2 simultaneous Step 2 chart images anchor correctly; this proves a
 * case no prior session tested — 3 simultaneous chart-bearing entries
 * (Pareto + Trend + the new distribution chart) in the same block, against
 * the real registry and the real `buildA3Layout`, not a guess.
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
      language: "tr",
      ai: { enabled: false, redaction: {} },
    },
    templateId: "farplas-7step-tr",
    steps: {
      1: emptyStep(),
      2: {
        entries: [
          {
            id: "pareto-entry-1",
            methodId: PARETO_METHOD_ID,
            title: "Hat 3 Pareto",
            order: 0,
            a3Visibility: "primary",
            payload: {
              unit: "adet",
              categories: [
                { id: "c1", label: "Sızdırmazlık", count: 12 },
                { id: "c2", label: "Boya hatası", count: 30 },
              ],
            },
            images: [],
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            provenance: { origin: "human" },
          },
          {
            id: "trend-entry-1",
            methodId: TREND_METHOD_ID,
            title: "Haftalık Trend",
            order: 1,
            a3Visibility: "primary",
            payload: {
              unit: "adet",
              points: [
                { id: "p1", label: "H1", value: 12 },
                { id: "p2", label: "H2", value: 8 },
              ],
              events: [],
            },
            images: [],
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            provenance: { origin: "human" },
          },
          {
            id: "distribution-entry-1",
            methodId: DISTRIBUTION_CHART_METHOD_ID,
            title: "Duvar Kalınlığı Dağılımı",
            order: 2,
            a3Visibility: "primary",
            payload: {
              chartType: "histogram",
              unit: "mm",
              binCount: "",
              samples: [
                { id: "s1", value: "1.1" },
                { id: "s2", value: "1.3" },
                { id: "s3", value: "1.5" },
              ],
              points: [],
            },
            images: [],
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            provenance: { origin: "human" },
          },
        ],
      },
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

const ONE_PIXEL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

describe("Phase 6c — three image-bearing entries in one block (Pareto + Trend + Distribution, Step 2)", () => {
  it("discovers a distinct, non-colliding pending image slot for every entry that is placed, none silently dropped", () => {
    const rendererMap = getA3RendererMap();
    const { pendingImages, descriptor } = buildA3Layout(fixtureProject(), farplas7StepTr, { rendererMap });

    // Measured, not assumed: all three stack inside Step 2's block at
    // B24/B35/B46 with zero overflow warnings — confirmed by running this
    // against the real template geometry before asserting it.
    expect(descriptor.overflowWarnings).toEqual([]);
    expect(pendingImages).toHaveLength(3);

    // Every discovered slot must anchor somewhere distinct — a collision here
    // is exactly D-111's "static/dynamic merge overlap" failure shape one
    // layer over, and exactly the class D-107's "zones fazla, kolon az"
    // belongs to (too much reserved content for too little available space).
    const anchors = pendingImages.map((slot) => slot.anchorCell);
    expect(new Set(anchors).size).toBe(3);

    // The distribution-chart slot specifically must have real, positive
    // geometry — a zero-sized box is D-106's failure shape.
    const distributionSlot = pendingImages.find((slot) => slot.entryId === "distribution-entry-1");
    expect(distributionSlot).toMatchObject({ kind: "distribution-chart" });
    expect(distributionSlot!.widthPt).toBeGreaterThan(0);
    expect(distributionSlot!.heightPt).toBeGreaterThan(0);
  });

  it("embeds every rasterized chart at its exact pending-slot geometry on the second call, none overwriting another", () => {
    const rendererMap = getA3RendererMap();
    const project = fixtureProject();
    const first = buildA3Layout(project, farplas7StepTr, { rendererMap });

    const images = first.pendingImages.map((slot) => ({
      id: `${slot.entryId}-${slot.kind}`,
      data: ONE_PIXEL_PNG_BASE64,
      mimeType: "image/png" as const,
      anchorCell: slot.anchorCell,
      widthPt: slot.widthPt,
      heightPt: slot.heightPt,
    }));

    const second = buildA3Layout(project, farplas7StepTr, { rendererMap, images });

    expect(second.descriptor.sheets.a3.images).toHaveLength(first.pendingImages.length);
    expect(second.descriptor.sheets.a3.images).toEqual(images);
    // Distinct ids prove none of the three overwrote another under the same anchor.
    expect(new Set(images.map((image) => image.id)).size).toBe(images.length);
  });
});
