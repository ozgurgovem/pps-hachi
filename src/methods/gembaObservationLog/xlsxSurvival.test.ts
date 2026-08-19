import { describe, expect, it } from "vitest";
import { buildA3Layout } from "../../a3/buildA3Layout";
import { resolveAssetImagePlacements } from "../../a3/render/resolveAssetImages";
import { farplas7StepTr } from "../../a3/templates/farplas-7step-tr";
import type { ProjectModel, StepState } from "../../domain/model";
import { getA3ImageRendererMap, getA3RendererMap } from "../registry";
import { GEMBA_OBSERVATION_LOG_METHOD_ID } from "./index";

/**
 * D-118/D-193: `gemba-observation-log` is `asset`-sourced (an ingested
 * photo, D-118), unlike every prior image-bearing method (`spec`-sourced —
 * a chart/diagram rasterized by `src/a3/render/rasterize.ts`). This proves
 * the *other* half of D-102's two-call `buildA3Layout` pattern: the first
 * call must discover a `source: "asset"` pending slot naming the real
 * `assetImageId`, and `resolveAssetImagePlacements` (never
 * `rasterizePendingImages`, never `getA3ImageRendererMap()`) must resolve it
 * to a real `ImagePlacement` from already-loaded bytes, embeddable at the
 * exact anchor the first call reserved.
 */
function emptyStep(): StepState {
  return { entries: [] };
}

function fixtureProject(): ProjectModel {
  return {
    id: "fixture-project-id",
    schemaVersion: 1,
    meta: {
      title: "Hat 3 Gemba Yürüyüşü",
      projectCode: "KZ-2026-020",
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
            id: "gemba-entry-1",
            methodId: GEMBA_OBSERVATION_LOG_METHOD_ID,
            title: "Sabah yürüyüşü",
            order: 0,
            a3Visibility: "primary",
            payload: { date: "2026-08-19", place: "Hat 3", observer: "Ayşe Yılmaz", whatWasSeen: "" },
            images: [{ id: "img-1", assetPath: "assets/img_img-1.jpg", thumbnailPath: "assets/thumb_img-1.jpg" }],
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

describe("gemba-observation-log — asset-sourced photo survival (D-118, D-193)", () => {
  it("discovers a pending asset-sourced image slot naming the entry's real photo id", () => {
    const rendererMap = getA3RendererMap();
    const { pendingImages } = buildA3Layout(fixtureProject(), farplas7StepTr, { rendererMap });

    expect(pendingImages).toHaveLength(1);
    expect(pendingImages[0]).toMatchObject({
      entryId: "gemba-entry-1",
      kind: "asset-photo",
      source: "asset",
      assetImageId: "img-1",
    });
    expect(pendingImages[0]!.widthPt).toBeGreaterThan(0);
    expect(pendingImages[0]!.heightPt).toBeGreaterThan(0);
  });

  it("resolves the asset slot to a real ImagePlacement from already-loaded otherEntries bytes, then embeds it at the reserved anchor", () => {
    const rendererMap = getA3RendererMap();
    const project = fixtureProject();
    const first = buildA3Layout(project, farplas7StepTr, { rendererMap });

    const images = resolveAssetImagePlacements(first.pendingImages, project, [
      { name: "assets/img_img-1.jpg", bytes: [0xff, 0xd8, 0xff, 0xe0] },
    ]);

    expect(images).toHaveLength(1);
    expect(images[0]!.mimeType).toBe("image/jpeg");
    expect(images[0]!.anchorCell).toBe(first.pendingImages[0]!.anchorCell);

    const second = buildA3Layout(project, farplas7StepTr, { rendererMap, images });
    expect(second.descriptor.sheets.a3.images).toEqual(images);
  });

  it("never registers a renderImage/imageKind for asset-sourced photos — nothing to rasterize", () => {
    const imageRendererMap = getA3ImageRendererMap();
    expect(imageRendererMap["asset-photo"]).toBeUndefined();
  });
});
