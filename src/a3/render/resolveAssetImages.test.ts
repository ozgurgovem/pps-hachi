import { describe, expect, it, vi } from "vitest";
import type { Entry, ProjectModel } from "../../domain/model";
import { createNewProject } from "../../domain/model/createProject";
import type { PendingImageSlot } from "../layout/place";
import { resolveAnnotatedPhotoSpecs, resolveAssetImagePlacements } from "./resolveAssetImages";

const NOW = "2026-08-19T10:00:00.000Z";

function projectWithEntry(overrides: Partial<Entry> = {}): ProjectModel {
  const { project } = createNewProject({ title: "T", language: "tr", appVersion: "0.0.0" });
  const entry: Entry = {
    id: "entry-1",
    methodId: "gemba-observation-log",
    title: "Gemba walk",
    order: 0,
    a3Visibility: "primary",
    payload: {},
    images: [{ id: "img-1", assetPath: "assets/img_img-1.jpg" }],
    createdAt: NOW,
    updatedAt: NOW,
    provenance: { origin: "human" },
    ...overrides,
  };
  return { ...project, steps: { ...project.steps, 2: { ...project.steps[2], entries: [entry] } } };
}

function assetSlot(overrides: Partial<PendingImageSlot> = {}): PendingImageSlot {
  return {
    entryId: "entry-1",
    kind: "asset-photo",
    spec: undefined,
    anchorCell: "B23",
    widthPt: 100,
    heightPt: 50,
    source: "asset",
    assetImageId: "img-1",
    ...overrides,
  };
}

describe("resolveAssetImagePlacements", () => {
  it("resolves an asset-sourced slot to a base64 ImagePlacement from already-loaded bytes", () => {
    const project = projectWithEntry();
    const placements = resolveAssetImagePlacements(
      [assetSlot()],
      project,
      [{ name: "assets/img_img-1.jpg", bytes: [0xff, 0xd8, 0xff] }],
    );

    expect(placements).toEqual([
      {
        id: "entry-1-img-1",
        data: btoa(String.fromCharCode(0xff, 0xd8, 0xff)),
        mimeType: "image/jpeg",
        anchorCell: "B23",
        widthPt: 100,
        heightPt: 50,
      },
    ]);
  });

  it("skips a spec-sourced slot entirely (that's rasterizePendingImages' job)", () => {
    const project = projectWithEntry();
    const placements = resolveAssetImagePlacements(
      [{ ...assetSlot(), source: undefined, assetImageId: undefined, kind: "pareto-chart", spec: {} }],
      project,
      [{ name: "assets/img_img-1.jpg", bytes: [1, 2, 3] }],
    );
    expect(placements).toEqual([]);
  });

  it("skips and logs when the image ref is not found on the entry, without throwing", () => {
    const project = projectWithEntry();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const placements = resolveAssetImagePlacements(
      [assetSlot({ assetImageId: "missing-image" })],
      project,
      [{ name: "assets/img_img-1.jpg", bytes: [1, 2, 3] }],
    );

    expect(placements).toEqual([]);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it("skips and logs when the image ref resolves but its bytes are not in otherEntries", () => {
    const project = projectWithEntry();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const placements = resolveAssetImagePlacements([assetSlot()], project, []);

    expect(placements).toEqual([]);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it("resolves multiple asset slots independently, one failure not blocking another", () => {
    const project = projectWithEntry({
      images: [
        { id: "img-1", assetPath: "assets/img_img-1.jpg" },
        { id: "img-2", assetPath: "assets/img_img-2.jpg" },
      ],
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const placements = resolveAssetImagePlacements(
      [assetSlot({ assetImageId: "img-1" }), assetSlot({ assetImageId: "img-2", anchorCell: "B30" })],
      project,
      [{ name: "assets/img_img-1.jpg", bytes: [9] }], // img-2's bytes deliberately missing
    );

    expect(placements).toHaveLength(1);
    expect(placements[0]?.id).toBe("entry-1-img-1");
    errorSpy.mockRestore();
  });
});

describe("resolveAnnotatedPhotoSpecs", () => {
  const annotations = [{ id: "a1", shape: "arrow", x0: 0.1, y0: 0.1, x1: 0.5, y1: 0.5 }];

  function annotatedSlot(overrides: Partial<PendingImageSlot> = {}): PendingImageSlot {
    return {
      entryId: "entry-1",
      kind: "annotated-photo",
      spec: { assetImageId: "img-1", annotations },
      anchorCell: "B23",
      widthPt: 100,
      heightPt: 50,
      ...overrides,
    };
  }

  it("resolves the referenced photo's bytes into a bytes-included render spec, leaving the slot's other fields untouched", () => {
    const project = projectWithEntry();

    const resolved = resolveAnnotatedPhotoSpecs(
      [annotatedSlot()],
      project,
      [{ name: "assets/img_img-1.jpg", bytes: [0xff, 0xd8, 0xff] }],
    );

    expect(resolved).toEqual([
      {
        ...annotatedSlot(),
        spec: { photoDataUrl: btoa(String.fromCharCode(0xff, 0xd8, 0xff)), mimeType: "image/jpeg", annotations },
      },
    ]);
  });

  it("passes a non-annotated-photo slot through completely unchanged", () => {
    const project = projectWithEntry();
    const paretoSlot: PendingImageSlot = {
      entryId: "entry-1",
      kind: "pareto-chart",
      spec: { kind: "pareto", items: [] },
      anchorCell: "B10",
      widthPt: 100,
      heightPt: 50,
    };

    const resolved = resolveAnnotatedPhotoSpecs([paretoSlot], project, []);

    expect(resolved).toEqual([paretoSlot]);
  });

  it("skips and logs when the referenced image is not on the entry", () => {
    const project = projectWithEntry();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const resolved = resolveAnnotatedPhotoSpecs(
      [annotatedSlot({ spec: { assetImageId: "missing", annotations } })],
      project,
      [{ name: "assets/img_img-1.jpg", bytes: [1] }],
    );

    expect(resolved).toEqual([]);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it("skips and logs when the image resolves but its bytes are not loaded", () => {
    const project = projectWithEntry();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const resolved = resolveAnnotatedPhotoSpecs([annotatedSlot()], project, []);

    expect(resolved).toEqual([]);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it("resolves one annotated slot and passes a spec slot through, side by side", () => {
    const project = projectWithEntry();
    const paretoSlot: PendingImageSlot = {
      entryId: "entry-1",
      kind: "pareto-chart",
      spec: { kind: "pareto", items: [] },
      anchorCell: "B10",
      widthPt: 100,
      heightPt: 50,
    };

    const resolved = resolveAnnotatedPhotoSpecs(
      [paretoSlot, annotatedSlot()],
      project,
      [{ name: "assets/img_img-1.jpg", bytes: [9] }],
    );

    expect(resolved).toHaveLength(2);
    expect(resolved[0]).toEqual(paretoSlot);
    expect(resolved[1]?.kind).toBe("annotated-photo");
  });
});
