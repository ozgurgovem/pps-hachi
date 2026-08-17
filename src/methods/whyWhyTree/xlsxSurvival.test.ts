import { describe, expect, it } from "vitest";
import { buildA3Layout } from "../../a3/buildA3Layout";
import { farplas7StepTr } from "../../a3/templates/farplas-7step-tr";
import type { ProjectModel, StepState } from "../../domain/model";
import { getA3ImageRendererMap, getA3RendererMap } from "../registry";
import { WHY_WHY_TREE_METHOD_ID } from "./index";

/**
 * Same D-102 two-call survival proof as `kpiStrip/xlsxSurvival.test.ts` —
 * the pipeline, not pixel content. `why-why-diagram` is this slice's own new
 * `imageKind`/`renderImage` registration (D-114's one mechanism budget), so
 * this test proves the *new* registration resolves end-to-end through the
 * real registry, not just that the plugin file looks complete when read.
 */
function emptyStep(): StepState {
  return { entries: [] };
}

function fixtureProject(): ProjectModel {
  return {
    id: "fixture-project-id",
    schemaVersion: 1,
    meta: {
      title: "EK-2905 Yüksek Fire Problemi",
      projectCode: "KZ-2026-014",
      revision: "A",
      owner: { name: "Gökhan Özen" },
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
      4: {
        entries: [
          {
            id: "why-why-tree-entry-1",
            methodId: WHY_WHY_TREE_METHOD_ID,
            title: "ADIM 4 Kök Neden Analizi",
            order: 0,
            a3Visibility: "primary",
            payload: {
              nodes: [
                { id: "n1", parentId: null, text: "Çatlak Firesi" },
                { id: "n2", parentId: "n1", text: "Lokma çeliği hammaddeye uygun değil", outcome: "confirmedRootCause" },
              ],
            },
            images: [],
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            provenance: { origin: "human" },
          },
        ],
      },
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

describe("why-why-tree — buildA3Layout two-call survival (D-102, D-176)", () => {
  it("discovers a pending why-why-diagram image slot anchored inside Step 4's block on the first call", () => {
    const rendererMap = getA3RendererMap();
    const { pendingImages } = buildA3Layout(fixtureProject(), farplas7StepTr, { rendererMap });

    expect(pendingImages).toHaveLength(1);
    expect(pendingImages[0]).toMatchObject({
      entryId: "why-why-tree-entry-1",
      kind: "why-why-diagram",
    });
    expect(pendingImages[0]!.widthPt).toBeGreaterThan(0);
    expect(pendingImages[0]!.heightPt).toBeGreaterThan(0);
  });

  it("resolves a renderer for why-why-diagram via the shared registry map", () => {
    const imageRendererMap = getA3ImageRendererMap();
    expect(imageRendererMap["why-why-diagram"]).toBeTypeOf("function");
  });

  it("embeds the rasterized diagram at the pending slot's exact geometry on the second call", () => {
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
