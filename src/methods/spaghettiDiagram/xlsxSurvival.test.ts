import { describe, expect, it } from "vitest";
import { buildA3Layout } from "../../a3/buildA3Layout";
import { farplas7StepTr } from "../../a3/templates/farplas-7step-tr";
import type { ProjectModel, StepState } from "../../domain/model";
import { getA3ImageRendererMap, getA3RendererMap } from "../registry";
import { SPAGHETTI_DIAGRAM_METHOD_ID } from "./index";

/**
 * `spaghetti-diagram` declares no `imageKind`/`renderImage` of its own (see
 * `index.ts`) — it relies on `defectPhotoBoardMethod`'s already-registered
 * `annotated-photo` renderer, `problem-impact`'s own C2 precedent for this
 * exact reuse shape. This proves that reuse works end-to-end through the
 * real registry.
 */
function emptyStep(): StepState {
  return { entries: [] };
}

function fixtureProject(): ProjectModel {
  return {
    id: "fixture-project-id",
    schemaVersion: 1,
    meta: {
      title: "Hat 3 Yerleşim İyileştirme",
      projectCode: "KZ-2026-023",
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
            id: "spaghetti-entry-1",
            methodId: SPAGHETTI_DIAGRAM_METHOD_ID,
            title: "Hat 3 malzeme akışı",
            order: 0,
            a3Visibility: "primary",
            payload: {},
            images: [
              {
                id: "img-1",
                assetPath: "assets/img_img-1.jpg",
                annotations: [{ id: "a1", shape: "path", points: [{ x: 0.1, y: 0.1 }, { x: 0.5, y: 0.6 }] }],
              },
            ],
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

describe("spaghetti-diagram — reuses defect-photo-board's annotated-photo renderer (C2 precedent)", () => {
  it("discovers a pending annotated-photo image slot on the first call", () => {
    const rendererMap = getA3RendererMap();
    const { pendingImages } = buildA3Layout(fixtureProject(), farplas7StepTr, { rendererMap });

    expect(pendingImages).toHaveLength(1);
    expect(pendingImages[0]).toMatchObject({ entryId: "spaghetti-entry-1", kind: "annotated-photo" });
  });

  it("embeds a rasterized composite at the reserved anchor on the second call", () => {
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
  });

  it("the registry still resolves a renderer for annotated-photo even though this plugin registers none", () => {
    const imageRendererMap = getA3ImageRendererMap();
    expect(typeof imageRendererMap["annotated-photo"]).toBe("function");
  });
});
