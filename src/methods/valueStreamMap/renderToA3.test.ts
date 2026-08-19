import { describe, expect, it } from "vitest";
import type { A3EntrySummary } from "../../a3/methodContract";
import { renderValueStreamMapToA3 } from "./renderToA3";

const ENTRY: A3EntrySummary = { id: "e1", title: "Hat 3 değer akış haritası" };

describe("renderValueStreamMapToA3", () => {
  it("emits only the title line when the entry has no photo", () => {
    const content = renderValueStreamMapToA3({}, ENTRY);
    expect(content.lines).toEqual([{ text: "Hat 3 değer akış haritası", bold: true }]);
    expect(content.image).toBeUndefined();
  });

  it("routes an annotated photo through the spec-sourced rasterize path", () => {
    const annotations = [{ id: "a1", shape: "callout" as const, x0: 0.4, y0: 0.4, text: "Kaizen fırsatı" }];
    const entryWithPhoto: A3EntrySummary = {
      ...ENTRY,
      images: [{ id: "img-1", assetPath: "assets/img_img-1.jpg", annotations }],
    };
    const content = renderValueStreamMapToA3({}, entryWithPhoto);
    expect(content.image).toMatchObject({ kind: "annotated-photo", spec: { assetImageId: "img-1", annotations } });
  });
});
