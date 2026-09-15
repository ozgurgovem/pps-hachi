import { describe, expect, it } from "vitest";
import { renderFishboneToA3 } from "./renderToA3";
import type { FishbonePayload } from "./schema";

describe("renderFishboneToA3", () => {
  it("carries the entry title as a bold line and as the image spec's effect label (P-34)", () => {
    const payload: FishbonePayload = {
      categorySet: "4M",
      causes: [{ id: "c1", categoryId: "man", text: "Yorgunluk" }],
    };

    const content = renderFishboneToA3(payload, { id: "entry-1", title: "Hat 3 Balık Kılçığı" });

    expect(content.lines).toEqual([{ text: "Hat 3 Balık Kılçığı", bold: true }]);
    expect(content.image?.kind).toBe("fishbone-diagram");
    expect(content.image?.spec).toEqual({ payload, effectLabel: "Hat 3 Balık Kılçığı", language: "en" });
  });

  it("omits rowSpan, letting placement fill whatever budget remains in the block", () => {
    const content = renderFishboneToA3({ categorySet: "4M", causes: [] }, { id: "e", title: "t" });
    expect(content.image?.rowSpan).toBeUndefined();
  });

  /**
   * P-42: the image spec must carry `entry.language`'s resolved value
   * (`resolveA3Language`), so the rasterizer — and `FishboneDiagram`'s own
   * `language` prop — can pick the right static category-label dictionary
   * instead of the editor's live UI language.
   */
  it("resolves the image spec's language from entry.language (P-42), defaulting to en when unset", () => {
    const payload: FishbonePayload = { categorySet: "4M", causes: [] };

    const trContent = renderFishboneToA3(payload, { id: "e", title: "t", language: "tr" });
    expect(trContent.image?.spec).toMatchObject({ language: "tr" });

    const defaultContent = renderFishboneToA3(payload, { id: "e", title: "t" });
    expect(defaultContent.image?.spec).toMatchObject({ language: "en" });
  });
});
