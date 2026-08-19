import { describe, expect, it } from "vitest";
import { buildA3Layout } from "../../a3/buildA3Layout";
import { resolveAnnotatedPhotoSpecs, resolveAssetImagePlacements } from "../../a3/render/resolveAssetImages";
import { farplas7StepTr } from "../../a3/templates/farplas-7step-tr";
import type { Annotation, Entry, ProjectModel, StepState } from "../../domain/model";
import { getA3ImageRendererMap, getA3RendererMap } from "../registry";
import { DEFECT_PHOTO_BOARD_METHOD_ID } from "./index";

/**
 * D-119: `defect-photo-board` is the first method whose photo can route
 * through *either* half of D-118's composition-root fork depending on
 * whether it carries annotations — proven here both ways, mirroring
 * `gemba-observation-log`'s asset-sourced test and `pareto`'s spec-sourced
 * one, plus `resolveAnnotatedPhotoSpecs`'s own byte-resolution step (the one
 * link in the annotated chain neither of those two precedents exercises).
 */
function emptyStep(): StepState {
  return { entries: [] };
}

function fixtureProject(entry: Entry): ProjectModel {
  return {
    id: "fixture-project-id",
    schemaVersion: 1,
    meta: {
      title: "Kalıp Çapak Problemi",
      projectCode: "KZ-2026-022",
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
      1: { entries: [entry] },
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

describe("defect-photo-board — unannotated photo takes the asset path (D-118)", () => {
  function entry(): Entry {
    return {
      id: "defect-entry-1",
      methodId: DEFECT_PHOTO_BOARD_METHOD_ID,
      title: "Kavite 3 çapak",
      order: 0,
      a3Visibility: "primary",
      payload: {},
      images: [{ id: "img-1", assetPath: "assets/img_img-1.jpg" }],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      provenance: { origin: "human" },
    };
  }

  it("discovers an asset-sourced pending slot, never annotated-photo", () => {
    const rendererMap = getA3RendererMap();
    const { pendingImages } = buildA3Layout(fixtureProject(entry()), farplas7StepTr, { rendererMap });

    expect(pendingImages).toHaveLength(1);
    expect(pendingImages[0]).toMatchObject({ kind: "asset-photo", source: "asset", assetImageId: "img-1" });
  });

  it("resolves via resolveAssetImagePlacements and embeds at the reserved anchor", () => {
    const rendererMap = getA3RendererMap();
    const project = fixtureProject(entry());
    const first = buildA3Layout(project, farplas7StepTr, { rendererMap });

    const images = resolveAssetImagePlacements(first.pendingImages, project, [
      { name: "assets/img_img-1.jpg", bytes: [0xff, 0xd8, 0xff] },
    ]);

    expect(images).toHaveLength(1);
    const second = buildA3Layout(project, farplas7StepTr, { rendererMap, images });
    expect(second.descriptor.sheets.a3.images).toEqual(images);
  });
});

describe("defect-photo-board — annotated photo routes through the spec-sourced rasterize path (D-119)", () => {
  const annotations: readonly Annotation[] = [
    { id: "a1", shape: "arrow", x0: 0.2, y0: 0.2, x1: 0.6, y1: 0.6 },
  ];

  function entry(): Entry {
    return {
      id: "defect-entry-1",
      methodId: DEFECT_PHOTO_BOARD_METHOD_ID,
      title: "Kavite 3 çapak",
      order: 0,
      a3Visibility: "primary",
      payload: {},
      images: [{ id: "img-1", assetPath: "assets/img_img-1.jpg", annotations: [...annotations] }],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      provenance: { origin: "human" },
    };
  }

  it("discovers an annotated-photo pending slot whose spec references the photo, not its bytes", () => {
    const rendererMap = getA3RendererMap();
    const { pendingImages } = buildA3Layout(fixtureProject(entry()), farplas7StepTr, { rendererMap });

    expect(pendingImages).toHaveLength(1);
    expect(pendingImages[0]).toMatchObject({
      kind: "annotated-photo",
      spec: { assetImageId: "img-1", annotations },
    });
    expect(pendingImages[0]!.source).toBeUndefined();
  });

  it("resolveAnnotatedPhotoSpecs turns the reference into a bytes-included render spec", () => {
    const rendererMap = getA3RendererMap();
    const project = fixtureProject(entry());
    const first = buildA3Layout(project, farplas7StepTr, { rendererMap });

    const resolved = resolveAnnotatedPhotoSpecs(first.pendingImages, project, [
      { name: "assets/img_img-1.jpg", bytes: [1, 2, 3] },
    ]);

    expect(resolved).toHaveLength(1);
    expect(resolved[0]!.spec).toMatchObject({
      photoDataUrl: btoa(String.fromCharCode(1, 2, 3)),
      mimeType: "image/jpeg",
      annotations,
    });
  });

  it("embeds the rasterized composite at the pending slot's exact geometry on the second call", () => {
    const rendererMap = getA3RendererMap();
    const project = fixtureProject(entry());
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

  it("registers the annotated-photo renderer in the shared image renderer map", () => {
    const imageRendererMap = getA3ImageRendererMap();
    expect(typeof imageRendererMap["annotated-photo"]).toBe("function");
  });
});
