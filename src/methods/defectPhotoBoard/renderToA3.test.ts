import { describe, expect, it } from "vitest";
import type { A3EntrySummary } from "../../a3/methodContract";
import { renderDefectPhotoBoardToA3 } from "./renderToA3";

const ENTRY: A3EntrySummary = { id: "e1", title: "Flash on cavity 3" };

describe("renderDefectPhotoBoardToA3", () => {
  it("emits only the title line when the entry has no photo", () => {
    const content = renderDefectPhotoBoardToA3({}, ENTRY);
    expect(content.lines).toEqual([{ text: "Flash on cavity 3", bold: true }]);
    expect(content.image).toBeUndefined();
  });

  it("requests an asset-sourced image for an unannotated photo", () => {
    const entryWithPhoto: A3EntrySummary = {
      ...ENTRY,
      images: [{ id: "img-1", assetPath: "assets/img_img-1.jpg" }],
    };
    const content = renderDefectPhotoBoardToA3({}, entryWithPhoto);
    expect(content.image).toMatchObject({ kind: "asset-photo", source: "asset", assetImageId: "img-1" });
  });

  it("routes an annotated photo through the spec-sourced rasterize path", () => {
    const annotations = [{ id: "a1", shape: "circle" as const, x0: 0.1, y0: 0.1, x1: 0.3, y1: 0.3 }];
    const entryWithPhoto: A3EntrySummary = {
      ...ENTRY,
      images: [{ id: "img-1", assetPath: "assets/img_img-1.jpg", annotations }],
    };
    const content = renderDefectPhotoBoardToA3({}, entryWithPhoto);
    expect(content.image).toMatchObject({
      kind: "annotated-photo",
      spec: { assetImageId: "img-1", annotations },
    });
  });
});
