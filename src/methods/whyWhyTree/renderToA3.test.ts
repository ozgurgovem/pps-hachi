import { describe, expect, it } from "vitest";
import { renderWhyWhyTreeToA3 } from "./renderToA3";
import type { WhyWhyTreePayload } from "./schema";

describe("renderWhyWhyTreeToA3 (D-176)", () => {
  it("carries the entry title as a bold line and as the image spec's root label", () => {
    const payload: WhyWhyTreePayload = {
      nodes: [{ id: "a", parentId: null, text: "Çatlak Firesi" }],
    };

    const content = renderWhyWhyTreeToA3(payload, { id: "entry-1", title: "EK-2905 Yüksek Fire" });

    expect(content.lines).toEqual([{ text: "EK-2905 Yüksek Fire", bold: true }]);
    expect(content.image?.kind).toBe("why-why-diagram");
    expect(content.image?.spec).toEqual({ payload, rootLabel: "EK-2905 Yüksek Fire" });
  });

  it("omits rowSpan, letting placement fill whatever budget remains in the block — same as Fishbone", () => {
    const content = renderWhyWhyTreeToA3({ nodes: [] }, { id: "e", title: "t" });
    expect(content.image?.rowSpan).toBeUndefined();
  });
});
