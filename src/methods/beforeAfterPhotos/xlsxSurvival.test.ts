import { describe, expect, it } from "vitest";
import { buildA3Layout } from "../../a3/buildA3Layout";
import { resolveAssetImagePlacements } from "../../a3/render/resolveAssetImages";
import { farplas7StepTr } from "../../a3/templates/farplas-7step-tr";
import type { ProjectModel, StepState } from "../../domain/model";
import { getA3RendererMap } from "../registry";
import { BEFORE_AFTER_PHOTOS_METHOD_ID } from "./index";

/**
 * D-118/D-193: `before-after-photos` is the zones-based sibling of
 * `gemba-observation-log`'s single-image test — proves D-102's
 * `placeZonesContent` (not just `placeBlockContent`'s vertical stack)
 * correctly discovers **two** simultaneous asset-sourced pending slots, one
 * per zone, at distinct non-colliding anchors, and that both resolve and
 * embed correctly on the second `buildA3Layout` call.
 */
function emptyStep(): StepState {
  return { entries: [] };
}

function fixtureProject(): ProjectModel {
  return {
    id: "fixture-project-id",
    schemaVersion: 1,
    meta: {
      title: "Fikstür İyileştirme",
      projectCode: "KZ-2026-021",
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
      6: {
        entries: [
          {
            id: "before-after-entry-1",
            methodId: BEFORE_AFTER_PHOTOS_METHOD_ID,
            title: "Fikstür değişimi",
            order: 0,
            a3Visibility: "primary",
            payload: {},
            images: [
              { id: "img-before", assetPath: "assets/img_img-before.jpg", role: "before" },
              { id: "img-after", assetPath: "assets/img_img-after.jpg", role: "after" },
            ],
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            provenance: { origin: "human" },
          },
        ],
      },
      7: emptyStep(),
      8: emptyStep(),
    },
    signOff: {},
    rounds: [],
  };
}

describe("before-after-photos — two-zone asset-sourced photo survival (D-118, D-193)", () => {
  it("discovers two pending asset-sourced image slots, one per role, at distinct anchors", () => {
    const rendererMap = getA3RendererMap();
    const { pendingImages } = buildA3Layout(fixtureProject(), farplas7StepTr, { rendererMap });

    expect(pendingImages).toHaveLength(2);
    const byAssetId = new Map(pendingImages.map((slot) => [slot.assetImageId, slot]));
    expect(byAssetId.get("img-before")).toMatchObject({ entryId: "before-after-entry-1", source: "asset" });
    expect(byAssetId.get("img-after")).toMatchObject({ entryId: "before-after-entry-1", source: "asset" });
    expect(pendingImages[0]!.anchorCell).not.toBe(pendingImages[1]!.anchorCell);
  });

  it("resolves both slots to real ImagePlacements and embeds them at their reserved anchors", () => {
    const rendererMap = getA3RendererMap();
    const project = fixtureProject();
    const first = buildA3Layout(project, farplas7StepTr, { rendererMap });

    const images = resolveAssetImagePlacements(first.pendingImages, project, [
      { name: "assets/img_img-before.jpg", bytes: [1, 2, 3] },
      { name: "assets/img_img-after.jpg", bytes: [4, 5, 6] },
    ]);

    expect(images).toHaveLength(2);
    const second = buildA3Layout(project, farplas7StepTr, { rendererMap, images });
    expect(second.descriptor.sheets.a3.images).toEqual(images);
  });
});
