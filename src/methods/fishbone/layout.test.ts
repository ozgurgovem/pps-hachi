import { describe, expect, it } from "vitest";
import { computeFishboneLayout } from "./layout";
import type { FishbonePayload } from "./schema";

describe("computeFishboneLayout (D-103)", () => {
  it("places one spine anchor and one category node per category in the chosen set", () => {
    const payload: FishbonePayload = { categorySet: "4M", causes: [] };
    const { nodes } = computeFishboneLayout(payload);

    const spineAnchors = nodes.filter((n) => n.data.kind === "spineAnchor");
    const categories = nodes.filter((n) => n.data.kind === "category");
    expect(spineAnchors).toHaveLength(4);
    expect(categories).toHaveLength(4);
  });

  it("connects consecutive spine anchors and each anchor to its category, forming the spine", () => {
    const payload: FishbonePayload = { categorySet: "4M", causes: [] };
    const { edges } = computeFishboneLayout(payload);

    const spineEdges = edges.filter((e) => e.source.startsWith("spine-") && e.target.startsWith("spine-"));
    const spineToCategoryEdges = edges.filter((e) => e.target.startsWith("category-"));
    expect(spineEdges).toHaveLength(3); // 4 categories -> 3 connecting edges
    expect(spineToCategoryEdges).toHaveLength(4);
  });

  it("never repeats a category's y position twice in a row — alternates above/below the spine", () => {
    const payload: FishbonePayload = { categorySet: "5M1E", causes: [] };
    const { nodes } = computeFishboneLayout(payload);
    const categoryYs = nodes.filter((n) => n.data.kind === "category").map((n) => n.position.y);

    for (let i = 1; i < categoryYs.length; i += 1) {
      expect(categoryYs[i]).not.toBe(categoryYs[i - 1]);
    }
  });

  it("attaches a cause to its category and derives the edge from categoryId, not a stored edge list", () => {
    const payload: FishbonePayload = {
      categorySet: "4M",
      causes: [{ id: "c1", categoryId: "machine", text: "Aşınmış kalıp" }],
    };
    const { nodes, edges } = computeFishboneLayout(payload);

    const causeNode = nodes.find((n) => n.id === "cause-c1");
    expect(causeNode?.data.label).toBe("Aşınmış kalıp");
    expect(edges.some((e) => e.source === "category-machine" && e.target === "cause-c1")).toBe(true);
  });

  it("uses a cause's stored position when present instead of the computed default", () => {
    const payload: FishbonePayload = {
      categorySet: "4M",
      causes: [{ id: "c1", categoryId: "man", text: "Yorgunluk", position: { x: 999, y: 111 } }],
    };
    const { nodes } = computeFishboneLayout(payload);
    expect(nodes.find((n) => n.id === "cause-c1")?.position).toEqual({ x: 999, y: 111 });
  });

  it("attaches a sub-cause to its parent cause, not to the category directly", () => {
    const payload: FishbonePayload = {
      categorySet: "4M",
      causes: [
        { id: "c1", categoryId: "man", text: "Yorgunluk" },
        { id: "c2", categoryId: "man", parentCauseId: "c1", text: "Uzun vardiya" },
      ],
    };
    const { edges } = computeFishboneLayout(payload);

    expect(edges.some((e) => e.source === "cause-c1" && e.target === "cause-c2")).toBe(true);
    expect(edges.some((e) => e.source === "category-man" && e.target === "cause-c2")).toBe(false);
  });
});
