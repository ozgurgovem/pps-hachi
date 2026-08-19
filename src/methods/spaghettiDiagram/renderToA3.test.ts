import { describe, expect, it } from "vitest";
import type { A3EntrySummary } from "../../a3/methodContract";
import { renderSpaghettiDiagramToA3 } from "./renderToA3";

const ENTRY: A3EntrySummary = { id: "e1", title: "Hat 3 malzeme akışı" };

describe("renderSpaghettiDiagramToA3", () => {
  it("emits only the title line when the entry has no photo", () => {
    const content = renderSpaghettiDiagramToA3({}, ENTRY);
    expect(content.lines).toEqual([{ text: "Hat 3 malzeme akışı", bold: true }]);
    expect(content.image).toBeUndefined();
  });

  it("routes an annotated photo (traced flow paths) through the spec-sourced rasterize path", () => {
    const annotations = [{ id: "a1", shape: "path" as const, points: [{ x: 0.1, y: 0.1 }, { x: 0.5, y: 0.6 }] }];
    const entryWithPhoto: A3EntrySummary = {
      ...ENTRY,
      images: [{ id: "img-1", assetPath: "assets/img_img-1.jpg", annotations }],
    };
    const content = renderSpaghettiDiagramToA3({}, entryWithPhoto);
    expect(content.image).toMatchObject({ kind: "annotated-photo", spec: { assetImageId: "img-1", annotations } });
  });
});
