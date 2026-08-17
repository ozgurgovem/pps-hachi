import { describe, expect, it } from "vitest";
import { computeWhyWhyTreeLayout } from "./layout";
import type { WhyWhyNode, WhyWhyTreePayload } from "./schema";

function payload(nodes: WhyWhyNode[]): WhyWhyTreePayload {
  return { nodes };
}

describe("computeWhyWhyTreeLayout (D-176)", () => {
  it("places one root anchor node when the tree has nodes", () => {
    const { nodes } = computeWhyWhyTreeLayout(payload([{ id: "a", parentId: null, text: "Çatlak Firesi" }]));
    expect(nodes.filter((n) => n.data.kind === "root")).toHaveLength(1);
  });

  it("adds no root anchor for an empty tree", () => {
    const { nodes } = computeWhyWhyTreeLayout(payload([]));
    expect(nodes.filter((n) => n.data.kind === "root")).toHaveLength(0);
  });

  it("connects the root anchor to every top-level (parentId: null) node", () => {
    const { edges } = computeWhyWhyTreeLayout(
      payload([
        { id: "a", parentId: null, text: "Çatlak Firesi" },
        { id: "b", parentId: null, text: "Setup Firesi" },
      ]),
    );
    expect(edges.some((e) => e.source === "root" && e.target === "a")).toBe(true);
    expect(edges.some((e) => e.source === "root" && e.target === "b")).toBe(true);
  });

  it("derives a child's edge from parentId, not a stored edge list", () => {
    const { edges } = computeWhyWhyTreeLayout(
      payload([
        { id: "a", parentId: null, text: "Çatlak Firesi" },
        { id: "b", parentId: "a", text: "Lokma deforme" },
      ]),
    );
    expect(edges.some((e) => e.source === "a" && e.target === "b")).toBe(true);
  });

  it("places nodes strictly deeper (farther in x) than their parent", () => {
    const { nodes } = computeWhyWhyTreeLayout(
      payload([
        { id: "a", parentId: null, text: "Çatlak Firesi" },
        { id: "b", parentId: "a", text: "Lokma deforme" },
        { id: "c", parentId: "b", text: "Hammaddeye uygun değil" },
      ]),
    );
    const root = nodes.find((n) => n.id === "root")!;
    const a = nodes.find((n) => n.id === "a")!;
    const b = nodes.find((n) => n.id === "b")!;
    const c = nodes.find((n) => n.id === "c")!;

    expect(a.position.x).toBeGreaterThan(root.position.x);
    expect(b.position.x).toBeGreaterThan(a.position.x);
    expect(c.position.x).toBeGreaterThan(b.position.x);
  });

  /**
   * D-176: the real EK-2905 panel repeatedly shows one why splitting into
   * two parallel continuations mid-chain (e.g. "kurutma işleminin
   * yapılmaması" branching into "ünitenin arızalanması" and "ünitenin
   * açılmaması"). Siblings must land on distinct rows, and their parent must
   * still connect to both.
   */
  it("gives two children of the same mid-chain node distinct rows and both an edge from that node", () => {
    const { nodes, edges } = computeWhyWhyTreeLayout(
      payload([
        { id: "a", parentId: null, text: "Çatlak Firesi" },
        { id: "b", parentId: "a", text: "Kurutma işleminin yapılmaması" },
        { id: "c", parentId: "b", text: "Ünitenin arızalanması" },
        { id: "d", parentId: "b", text: "Ünitenin açılmaması" },
      ]),
    );

    expect(edges.some((e) => e.source === "b" && e.target === "c")).toBe(true);
    expect(edges.some((e) => e.source === "b" && e.target === "d")).toBe(true);

    const c = nodes.find((n) => n.id === "c")!;
    const d = nodes.find((n) => n.id === "d")!;
    expect(c.position.y).not.toBe(d.position.y);
  });

  it("gives every leaf a distinct row across multiple root branches, without overlap", () => {
    const { nodes } = computeWhyWhyTreeLayout(
      payload([
        { id: "cat1", parentId: null, text: "Çatlak Firesi" },
        { id: "cat1-a", parentId: "cat1", text: "A" },
        { id: "cat1-b", parentId: "cat1", text: "B" },
        { id: "cat2", parentId: null, text: "Setup Firesi" },
        { id: "cat2-a", parentId: "cat2", text: "C" },
      ]),
    );
    const leafRows = ["cat1-a", "cat1-b", "cat2-a"].map((id) => nodes.find((n) => n.id === id)!.position.y);
    expect(new Set(leafRows).size).toBe(3);
  });

  it("positions an internal node between the rows of its children", () => {
    const { nodes } = computeWhyWhyTreeLayout(
      payload([
        { id: "a", parentId: null, text: "Çatlak Firesi" },
        { id: "a1", parentId: "a", text: "A" },
        { id: "a2", parentId: "a", text: "B" },
      ]),
    );
    const a1 = nodes.find((n) => n.id === "a1")!.position.y;
    const a2 = nodes.find((n) => n.id === "a2")!.position.y;
    const a = nodes.find((n) => n.id === "a")!.position.y;
    const [lo, hi] = a1 < a2 ? [a1, a2] : [a2, a1];
    expect(a).toBeGreaterThanOrEqual(lo);
    expect(a).toBeLessThanOrEqual(hi);
  });

  it("treats a node whose parent no longer exists as its own root (D-100 never-truncate)", () => {
    const { nodes, edges } = computeWhyWhyTreeLayout(payload([{ id: "orphan", parentId: "missing", text: "x" }]));
    expect(nodes.find((n) => n.id === "orphan")).toBeDefined();
    expect(edges.some((e) => e.source === "root" && e.target === "orphan")).toBe(true);
  });

  it("labels the root anchor with rootLabel, defaulting to an empty string", () => {
    const withLabel = computeWhyWhyTreeLayout(payload([{ id: "a", parentId: null, text: "x" }]), "Yüksek fire");
    expect(withLabel.nodes.find((n) => n.data.kind === "root")?.data.label).toBe("Yüksek fire");

    const withoutLabel = computeWhyWhyTreeLayout(payload([{ id: "a", parentId: null, text: "x" }]));
    expect(withoutLabel.nodes.find((n) => n.data.kind === "root")?.data.label).toBe("");
  });

  describe("outcome markers (§2.2)", () => {
    it("marks a controlled leaf with a checkmark and no KN number", () => {
      const { nodes } = computeWhyWhyTreeLayout(
        payload([{ id: "a", parentId: null, text: "x", outcome: "controlled" }]),
      );
      expect(nodes.find((n) => n.id === "a")?.data.outcomeLabel).toBe("✓");
    });

    it("marks a confirmed-root-cause leaf with its derived KN number", () => {
      const { nodes } = computeWhyWhyTreeLayout(
        payload([
          { id: "a", parentId: null, text: "x", outcome: "confirmedRootCause" },
          { id: "b", parentId: null, text: "y", outcome: "confirmedRootCause" },
        ]),
      );
      expect(nodes.find((n) => n.id === "a")?.data.outcomeLabel).toBe("✗ KN1");
      expect(nodes.find((n) => n.id === "b")?.data.outcomeLabel).toBe("✗ KN2");
    });

    it("shows no outcome marker on a node with children, even if it carries a stale outcome", () => {
      const { nodes } = computeWhyWhyTreeLayout(
        payload([
          { id: "a", parentId: null, text: "x", outcome: "confirmedRootCause" },
          { id: "b", parentId: "a", text: "y" },
        ]),
      );
      expect(nodes.find((n) => n.id === "a")?.data.outcomeLabel).toBeUndefined();
    });

    it("shows no outcome marker on an unmarked leaf", () => {
      const { nodes } = computeWhyWhyTreeLayout(payload([{ id: "a", parentId: null, text: "x" }]));
      expect(nodes.find((n) => n.id === "a")?.data.outcomeLabel).toBeUndefined();
    });
  });
});
