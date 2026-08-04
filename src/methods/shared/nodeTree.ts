/**
 * Shared "branching node list" substrate — the tree analogue of D-115's
 * `rowTable.ts`. Two of Phase 6b's Step 4 methods are the same shape (the
 * Why-Why logic tree and the Fault Tree, `SPEC.md` §1.3), which is the
 * repetition D-115's own rule says to abstract on sight rather than after
 * paying for it twice.
 *
 * Stored **flat** with a `parentId`, never nested. Two representations of one
 * relationship with no precedence rule is the trap D-71 named and Phase 5's
 * Fishbone already avoided the same way: edges are derived from `parentId` at
 * render time, never stored alongside it.
 */

export interface TreeNode {
  readonly id: string;
  /** `null` for a root node. */
  readonly parentId: string | null;
  readonly text: string;
}

export function newTreeNode(parentId: string | null): TreeNode {
  return { id: crypto.randomUUID(), parentId, text: "" };
}

export function childrenOf<T extends TreeNode>(nodes: readonly T[], parentId: string | null): readonly T[] {
  return nodes.filter((node) => node.parentId === parentId);
}

/**
 * Removes a node and everything beneath it. A tree that can strand orphaned
 * children behind a deleted parent renders as a second root, which reads as
 * data corruption to the user rather than as a delete.
 */
export function removeSubtree<T extends TreeNode>(nodes: readonly T[], nodeId: string): T[] {
  const doomed = new Set<string>([nodeId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const node of nodes) {
      if (node.parentId !== null && doomed.has(node.parentId) && !doomed.has(node.id)) {
        doomed.add(node.id);
        grew = true;
      }
    }
  }
  return nodes.filter((node) => !doomed.has(node.id));
}

/** Depth-first order with a depth per node — the order both the editor and the A3 renderer walk. */
export function flattenTree<T extends TreeNode>(nodes: readonly T[]): readonly { node: T; depth: number }[] {
  const out: { node: T; depth: number }[] = [];

  function walk(parentId: string | null, depth: number) {
    for (const node of childrenOf(nodes, parentId)) {
      out.push({ node, depth });
      walk(node.id, depth + 1);
    }
  }

  walk(null, 0);

  /*
   * A node whose parent was lost (a hand-edited `.ppsx`, or a newer build's
   * shape) would otherwise vanish from both the editor and the export. D-100's
   * never-truncate guarantee applies to a malformed tree too: show it at the
   * root rather than silently dropping it.
   */
  const rendered = new Set(out.map((item) => item.node.id));
  for (const node of nodes) {
    if (!rendered.has(node.id)) {
      out.push({ node, depth: 0 });
    }
  }

  return out;
}

/**
 * Default A3 rendering for a node tree: one line per non-blank node, indented
 * by depth. `decorate` lets a method prefix its own per-node marker (the Fault
 * Tree's AND/OR gate) without the substrate knowing what a gate is.
 */
export function treeLines<T extends TreeNode>(
  nodes: readonly T[],
  decorate?: (node: T) => string,
): readonly { readonly text: string }[] {
  return flattenTree(nodes)
    .filter(({ node }) => node.text.trim().length > 0)
    .map(({ node, depth }) => ({
      text: `${"    ".repeat(depth)}${decorate ? decorate(node) : ""}${node.text.trim()}`,
    }));
}
