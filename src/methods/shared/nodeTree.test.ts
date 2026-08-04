import { describe, expect, it } from "vitest";
import { childrenOf, flattenTree, newTreeNode, removeSubtree, treeLines, type TreeNode } from "./nodeTree";

function node(id: string, parentId: string | null, text = id): TreeNode {
  return { id, parentId, text };
}

describe("newTreeNode", () => {
  it("mints a blank node under the given parent", () => {
    const created = newTreeNode("p1");

    expect(created.parentId).toBe("p1");
    expect(created.text).toBe("");
    expect(created.id).not.toBe("");
  });
});

describe("childrenOf", () => {
  it("returns only direct children", () => {
    const nodes = [node("a", null), node("b", "a"), node("c", "b")];

    expect(childrenOf(nodes, "a").map((n) => n.id)).toEqual(["b"]);
  });
});

describe("flattenTree", () => {
  it("walks depth-first with a depth per node", () => {
    const nodes = [node("a", null), node("b", "a"), node("c", "b"), node("d", null)];

    expect(flattenTree(nodes).map(({ node: n, depth }) => [n.id, depth])).toEqual([
      ["a", 0],
      ["b", 1],
      ["c", 2],
      ["d", 0],
    ]);
  });

  /** D-100's never-truncate guarantee, applied to a malformed tree. */
  it("surfaces a node whose parent is missing rather than dropping it", () => {
    const nodes = [node("a", null), node("orphan", "gone")];

    expect(flattenTree(nodes).map(({ node: n }) => n.id)).toEqual(["a", "orphan"]);
  });

  it("does not loop forever on a cycle", () => {
    const nodes = [node("a", "b"), node("b", "a")];

    expect(flattenTree(nodes)).toHaveLength(2);
  });
});

describe("removeSubtree", () => {
  it("removes the node and every descendant", () => {
    const nodes = [node("a", null), node("b", "a"), node("c", "b"), node("d", null)];

    expect(removeSubtree(nodes, "a").map((n) => n.id)).toEqual(["d"]);
  });

  it("leaves siblings alone", () => {
    const nodes = [node("a", null), node("b", "a"), node("c", "a")];

    expect(removeSubtree(nodes, "b").map((n) => n.id)).toEqual(["a", "c"]);
  });
});

describe("treeLines", () => {
  it("indents by depth and drops blank nodes", () => {
    const nodes = [node("a", null, "Machine stopped"), node("b", "a", ""), node("c", "a", "No lubrication")];

    expect(treeLines(nodes)).toEqual([{ text: "Machine stopped" }, { text: "    No lubrication" }]);
  });

  it("lets the caller prefix a per-node marker", () => {
    const nodes = [node("a", null, "Top event")];

    expect(treeLines(nodes, () => "[AND] ")).toEqual([{ text: "[AND] Top event" }]);
  });
});
