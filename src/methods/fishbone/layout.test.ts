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

  /**
   * P-34: three geometry corrections against the approved visual (D-175) —
   * diagonal branches, causes closer to the spine than their category, and
   * a new terminal effect node.
   */
  describe("P-34 corrections", () => {
    it("offsets a category diagonally off its spine anchor, not straight up/down", () => {
      const payload: FishbonePayload = { categorySet: "4M", causes: [] };
      const { nodes } = computeFishboneLayout(payload);

      const spineAnchor = nodes.find((n) => n.id === "spine-man")!;
      const category = nodes.find((n) => n.id === "category-man")!;

      expect(category.position.x).not.toBe(spineAnchor.position.x);
      expect(category.position.y).not.toBe(spineAnchor.position.y);
    });

    it("positions a cause strictly between the spine and its category, never farther out", () => {
      const payload: FishbonePayload = {
        categorySet: "4M",
        causes: [{ id: "c1", categoryId: "man", text: "Yorgunluk" }],
      };
      const { nodes } = computeFishboneLayout(payload);

      const spineAnchor = nodes.find((n) => n.id === "spine-man")!;
      const category = nodes.find((n) => n.id === "category-man")!;
      const cause = nodes.find((n) => n.id === "cause-c1")!;

      const categoryDistance = Math.hypot(
        category.position.x - spineAnchor.position.x,
        category.position.y - spineAnchor.position.y,
      );
      const causeDistance = Math.hypot(
        cause.position.x - spineAnchor.position.x,
        cause.position.y - spineAnchor.position.y,
      );

      expect(causeDistance).toBeLessThan(categoryDistance);
    });

    it("spreads several causes in one category strictly between the spine and the category, without overlap", () => {
      const payload: FishbonePayload = {
        categorySet: "4M",
        causes: [
          { id: "c1", categoryId: "man", text: "A" },
          { id: "c2", categoryId: "man", text: "B" },
          { id: "c3", categoryId: "man", text: "C" },
        ],
      };
      const { nodes } = computeFishboneLayout(payload);

      const spineAnchor = nodes.find((n) => n.id === "spine-man")!;
      const category = nodes.find((n) => n.id === "category-man")!;
      const categoryDistance = Math.hypot(
        category.position.x - spineAnchor.position.x,
        category.position.y - spineAnchor.position.y,
      );

      const causeYs = new Set<number>();
      for (const id of ["cause-c1", "cause-c2", "cause-c3"]) {
        const cause = nodes.find((n) => n.id === id)!;
        const distance = Math.hypot(
          cause.position.x - spineAnchor.position.x,
          cause.position.y - spineAnchor.position.y,
        );
        expect(distance).toBeLessThan(categoryDistance);
        causeYs.add(cause.position.y);
      }
      expect(causeYs.size).toBe(3);
    });

    it("adds one terminal effect node at the spine's far end, connected to the last spine anchor", () => {
      const payload: FishbonePayload = { categorySet: "4M", causes: [] };
      const { nodes, edges } = computeFishboneLayout(payload, "Çapak fire oranı yüksek");

      const effect = nodes.find((n) => n.data.kind === "effect");
      expect(effect).toBeDefined();
      expect(effect?.data.label).toBe("Çapak fire oranı yüksek");

      const spineAnchors = nodes.filter((n) => n.data.kind === "spineAnchor");
      const lastSpineAnchor = spineAnchors[spineAnchors.length - 1]!;
      expect(effect!.position.x).toBeGreaterThan(lastSpineAnchor.position.x);
      expect(edges.some((e) => e.source === lastSpineAnchor.id && e.target === effect!.id)).toBe(true);
    });

    it("defaults the effect label to an empty string when omitted", () => {
      const { nodes } = computeFishboneLayout({ categorySet: "4M", causes: [] });
      expect(nodes.find((n) => n.data.kind === "effect")?.data.label).toBe("");
    });
  });
});
