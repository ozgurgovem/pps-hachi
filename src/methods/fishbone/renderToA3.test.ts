import { describe, expect, it } from "vitest";
import { renderFishboneToA3 } from "./renderToA3";
import type { FishbonePayload } from "./schema";

describe("renderFishboneToA3", () => {
  it("carries the entry title as a bold line and the payload as a fishbone-diagram image spec", () => {
    const payload: FishbonePayload = {
      categorySet: "4M",
      causes: [{ id: "c1", categoryId: "man", text: "Yorgunluk" }],
    };

    const content = renderFishboneToA3(payload, { id: "entry-1", title: "Hat 3 Balık Kılçığı" });

    expect(content.lines).toEqual([{ text: "Hat 3 Balık Kılçığı", bold: true }]);
    expect(content.image?.kind).toBe("fishbone-diagram");
    expect(content.image?.spec).toEqual(payload);
  });

  it("omits rowSpan, letting placement fill whatever budget remains in the block", () => {
    const content = renderFishboneToA3({ categorySet: "4M", causes: [] }, { id: "e", title: "t" });
    expect(content.image?.rowSpan).toBeUndefined();
  });
});
