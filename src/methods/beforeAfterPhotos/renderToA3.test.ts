import { describe, expect, it } from "vitest";
import type { A3EntrySummary } from "../../a3/methodContract";
import { renderBeforeAfterPhotosToA3 } from "./renderToA3";

const ENTRY: A3EntrySummary = { id: "e1", title: "Fixture rework" };

describe("renderBeforeAfterPhotosToA3", () => {
  it("emits a two-zone strip with no image in either zone when neither photo is attached", () => {
    const content = renderBeforeAfterPhotosToA3({}, ENTRY);

    expect(content.zones).toHaveLength(2);
    expect(content.zones![0]).toEqual({
      widthFraction: 0.5,
      lines: [{ text: "Fixture rework", bold: true }, { text: "Before" }],
    });
    expect(content.zones![1]).toEqual({ widthFraction: 0.5, lines: [{ text: "After" }] });
  });

  it("requests each role's photo as an asset-sourced image in its own zone", () => {
    const entryWithPhotos: A3EntrySummary = {
      ...ENTRY,
      images: [
        { id: "img-before", assetPath: "assets/img_img-before.jpg", role: "before" },
        { id: "img-after", assetPath: "assets/img_img-after.jpg", role: "after" },
      ],
    };

    const content = renderBeforeAfterPhotosToA3({}, entryWithPhotos);

    expect(content.zones![0]!.image).toEqual({
      kind: "asset-photo",
      spec: undefined,
      source: "asset",
      assetImageId: "img-before",
    });
    expect(content.zones![1]!.image).toEqual({
      kind: "asset-photo",
      spec: undefined,
      source: "asset",
      assetImageId: "img-after",
    });
  });

  it("only fills the zone whose role has a photo — a lone before-photo leaves the after zone bare", () => {
    const entryWithOnePhoto: A3EntrySummary = {
      ...ENTRY,
      images: [{ id: "img-before", assetPath: "assets/img_img-before.jpg", role: "before" }],
    };

    const content = renderBeforeAfterPhotosToA3({}, entryWithOnePhoto);

    expect(content.zones![0]!.image).toBeDefined();
    expect(content.zones![1]!.image).toBeUndefined();
  });

  it("uses Turkish zone labels when the entry's language is tr", () => {
    const trEntry: A3EntrySummary = { ...ENTRY, language: "tr" };
    const content = renderBeforeAfterPhotosToA3({}, trEntry);

    expect(content.zones![0]!.lines).toEqual([{ text: "Fixture rework", bold: true }, { text: "Önce" }]);
    expect(content.zones![1]!.lines).toEqual([{ text: "Sonra" }]);
  });
});
