import { describe, expect, it } from "vitest";
import { buildA3Layout } from "../../a3/buildA3Layout";
import { farplas7StepTr } from "../../a3/templates/farplas-7step-tr";
import type { ProjectModel, StepState } from "../../domain/model";
import { getA3ImageRendererMap, getA3RendererMap } from "../registry";
import { PROBLEM_IMPACT_METHOD_ID } from "./index";

/**
 * `problem-impact` deliberately declares no `imageKind`/`renderImage` of its
 * own (see `index.ts`) — it relies on `paretoMethod`'s already-registered
 * `pareto-chart` renderer. This test proves that reuse actually works
 * end-to-end through the real registry, not just that the two plugins look
 * similar when read: D-102's two-call `buildA3Layout` pattern must discover
 * a pending image slot for a `problem-impact` entry, and
 * `getA3ImageRendererMap()` — built from the whole registry, not from this
 * plugin alone — must still resolve a renderer for it.
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
      1: {
        entries: [
          {
            id: "problem-impact-entry-1",
            methodId: PROBLEM_IMPACT_METHOD_ID,
            title: "Fire maliyeti",
            order: 0,
            a3Visibility: "primary",
            payload: {
              unit: "adet",
              categories: [
                { id: "c1", label: "Sızdırmazlık", count: 12 },
                { id: "c2", label: "Boya hatası", count: 30 },
              ],
              monthlyLoss: "",
              yearlyLoss: "",
              currencyUnit: "",
              calculationNote: "",
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

const ONE_PIXEL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

describe("problem-impact — shared pareto-chart renderer survival (D-102, D-163)", () => {
  it("discovers a pending pareto-chart image slot for the problem-impact entry", () => {
    const rendererMap = getA3RendererMap();
    const { pendingImages } = buildA3Layout(fixtureProject(), farplas7StepTr, { rendererMap });

    expect(pendingImages).toHaveLength(1);
    expect(pendingImages[0]).toMatchObject({
      entryId: "problem-impact-entry-1",
      kind: "pareto-chart",
    });
    expect(pendingImages[0]!.widthPt).toBeGreaterThan(0);
    expect(pendingImages[0]!.heightPt).toBeGreaterThan(0);
  });

  it("resolves a renderer for that slot via the shared registry map, even though problem-impact declares no renderImage of its own", () => {
    const imageRendererMap = getA3ImageRendererMap();
    expect(imageRendererMap["pareto-chart"]).toBeTypeOf("function");
  });

  it("embeds the rasterized chart at the pending slot's exact geometry on the second call", () => {
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

    expect(second.descriptor.sheets.a3.images).toEqual(images);
    expect(second.descriptor.sheets.a3.images[0]!.anchorCell).toBe(first.pendingImages[0]!.anchorCell);
  });
});
