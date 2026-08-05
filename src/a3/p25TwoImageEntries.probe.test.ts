import { describe, expect, it } from "vitest";
import { buildA3Layout } from "./buildA3Layout";
import { farplas7StepTr } from "./templates/farplas-7step-tr";
import type { ProjectModel, StepState } from "../domain/model";
import { getA3RendererMap } from "../methods/registry";
import { PARETO_METHOD_ID } from "../methods/pareto/index";
import { TREND_METHOD_ID } from "../methods/trend/index";

/**
 * P-25 PROBE: DECISIONS.md records a real-app finding — a Step 2 block
 * holding two image-bearing entries (Pareto + Trend), both `primary`, both
 * with their text on the sheet, embeds only ONE image in the exported
 * `.xlsx` (`xl/drawings/drawing1.xml` anchors 3 pictures total, not the
 * expected 4). Not an appendix-overflow case (D-100) — the workbook has
 * exactly one worksheet. This exercises the real `buildA3Layout` two-call
 * pattern (D-102) against the real Pareto/Trend plugins, the same discipline
 * D-105/D-111 used, to root-cause before fixing rather than guessing.
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

describe("P-25 — two image-bearing entries in one block (Pareto + Trend, Step 2)", () => {
  it("discovers TWO distinct pending image slots on the first call, neither dropped", () => {
    const rendererMap = getA3RendererMap();
    const { pendingImages, descriptor } = buildA3Layout(fixtureProject(), farplas7StepTr, {
      rendererMap,
    });

    expect(descriptor.overflowWarnings).toEqual([]);
    expect(pendingImages).toHaveLength(2);

    const anchors = pendingImages.map((slot) => slot.anchorCell);
    expect(new Set(anchors).size).toBe(2);
  });

  it("embeds BOTH rasterized charts at their exact anchors on the second call", () => {
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

    expect(second.descriptor.sheets.a3.images).toHaveLength(2);
    expect(second.descriptor.sheets.a3.images).toEqual(images);
  });
});
