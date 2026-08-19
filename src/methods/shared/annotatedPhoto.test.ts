import { describe, expect, it } from "vitest";
import type { A3EntrySummary } from "../../a3/methodContract";
import { renderAnnotatedPhotoBlock } from "./annotatedPhoto";

const ENTRY: A3EntrySummary = { id: "e1", title: "Flash on cavity 3" };

describe("renderAnnotatedPhotoBlock", () => {
  it("emits only the title line when the entry has no photo", () => {
    const content = renderAnnotatedPhotoBlock(ENTRY);

    expect(content.lines).toEqual([{ text: "Flash on cavity 3", bold: true }]);
    expect(content.image).toBeUndefined();
  });

  it("requests an asset-sourced image for an unannotated photo — never rasterized", () => {
    const entryWithPhoto: A3EntrySummary = {
      ...ENTRY,
      images: [{ id: "img-1", assetPath: "assets/img_img-1.jpg" }],
    };

    const content = renderAnnotatedPhotoBlock(entryWithPhoto);

    expect(content.image).toEqual({
      kind: "asset-photo",
      spec: undefined,
      source: "asset",
      assetImageId: "img-1",
      rowSpan: 10,
    });
  });

  it("requests an asset-sourced image when the photo's annotations array is present but empty", () => {
    const entryWithPhoto: A3EntrySummary = {
      ...ENTRY,
      images: [{ id: "img-1", assetPath: "assets/img_img-1.jpg", annotations: [] }],
    };

    const content = renderAnnotatedPhotoBlock(entryWithPhoto);

    expect(content.image?.kind).toBe("asset-photo");
  });

  it("routes an annotated photo through the spec-sourced rasterize path (D-119)", () => {
    const annotations = [{ id: "a1", shape: "arrow" as const, x0: 0.1, y0: 0.1, x1: 0.4, y1: 0.4 }];
    const entryWithPhoto: A3EntrySummary = {
      ...ENTRY,
      images: [{ id: "img-1", assetPath: "assets/img_img-1.jpg", annotations }],
    };

    const content = renderAnnotatedPhotoBlock(entryWithPhoto);

    expect(content.image).toEqual({
      kind: "annotated-photo",
      spec: { assetImageId: "img-1", annotations },
      rowSpan: 10,
    });
    expect(content.image?.source).toBeUndefined();
  });

  it("uses the first photo when an entry somehow carries more than one", () => {
    const entryWithPhotos: A3EntrySummary = {
      ...ENTRY,
      images: [
        { id: "img-1", assetPath: "assets/img_img-1.jpg" },
        { id: "img-2", assetPath: "assets/img_img-2.jpg" },
      ],
    };

    const content = renderAnnotatedPhotoBlock(entryWithPhotos);

    expect(content.image?.assetImageId).toBe("img-1");
  });
});
