import { describe, expect, it } from "vitest";
import { buildA3Layout } from "../../a3/buildA3Layout";
import { farplas7StepTr } from "../../a3/templates/farplas-7step-tr";
import type { ProjectModel, StepState } from "../../domain/model";
import { getA3ImageRendererMap, getA3RendererMap } from "../registry";
import { KPI_STRIP_METHOD_ID } from "./index";

/**
 * Same D-102 two-call survival proof as `distributionChart/xlsxSurvival.test.ts`
 * — the pipeline, not pixel content. Unlike `problem-impact` (C2), `kpi-strip`
 * declares its own `imageKind`/`renderImage` (this slice's one new mechanism,
 * D-114/D-167/D-177), so this test proves the *new* registration resolves
 * end-to-end through the real registry, not just that the plugin file looks
 * complete when read.
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
      2: emptyStep(),
      3: emptyStep(),
      4: emptyStep(),
      5: emptyStep(),
      6: emptyStep(),
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
      8: emptyStep(),
    },
    signOff: {},
    rounds: [],
  };
}

const ONE_PIXEL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

describe("kpi-strip — buildA3Layout two-call survival (D-102, D-167)", () => {
  it("discovers a pending kpi-strip image slot anchored inside Step 7's block on the first call", () => {
    const rendererMap = getA3RendererMap();
    const { pendingImages } = buildA3Layout(fixtureProject(), farplas7StepTr, { rendererMap });

    expect(pendingImages).toHaveLength(1);
    expect(pendingImages[0]).toMatchObject({
      entryId: "kpi-strip-entry-1",
      kind: "kpi-strip",
    });
    expect(pendingImages[0]!.widthPt).toBeGreaterThan(0);
    expect(pendingImages[0]!.heightPt).toBeGreaterThan(0);
  });

  it("resolves a renderer for kpi-strip via the shared registry map", () => {
    const imageRendererMap = getA3ImageRendererMap();
    expect(imageRendererMap["kpi-strip"]).toBeTypeOf("function");
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
