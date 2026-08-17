import type { Edge, Node } from "@xyflow/react";
import { childrenOf, flattenTree } from "../shared/nodeTree";
import { confirmedRootCauseNumbers, visibleOutcome } from "./outcome";
import type { WhyWhyNode, WhyWhyOutcome, WhyWhyTreePayload } from "./schema";

const ROOT_X = 40;
const COLUMN_SPACING_X = 220;
const ROW_SPACING_Y = 70;

export interface WhyWhyTreeNodeData extends Record<string, unknown> {
  readonly kind: "root" | "node";
  readonly label?: string;
  readonly outcome?: WhyWhyOutcome;
  readonly outcomeLabel?: string;
}

export type WhyWhyTreeNode = Node<WhyWhyTreeNodeData>;
export type WhyWhyTreeEdge = Edge;

export interface WhyWhyTreeLayout {
  readonly nodes: readonly WhyWhyTreeNode[];
  readonly edges: readonly WhyWhyTreeEdge[];
}

/** What `renderToA3.ts` hands to the off-screen rasterizer (D-102) — the payload plus the block's own problem statement for the diagram's root/title anchor, same pattern as `FishboneImageSpec` (P-34). */
export interface WhyWhyTreeImageSpec {
  readonly payload: WhyWhyTreePayload;
  readonly rootLabel: string;
}

function outcomeLabel(outcome: WhyWhyOutcome | undefined, kn: number | undefined): string | undefined {
  if (outcome === "controlled") {
    return "✓";
  }
  if (outcome === "confirmedRootCause") {
    return kn !== undefined ? `✗ KN${kn}` : "✗";
  }
  return undefined;
}

/**
 * Assigns each node a vertical row — a lightweight Reingold–Tilford-style
 * layout: leaves get sequential rows in `flattenTree`'s own depth-first
 * order (the same order the Editor and `treeLines` already walk), and an
 * internal node sits at the average row of its children, computed bottom-up.
 * Good enough for a why-why tree's depth and mid-chain branching (D-176) —
 * unlike Fishbone's fixed-category spine, this tree has no bounded shape to
 * hand-tune constants against.
 *
 * A node whose parent was lost (D-100's never-truncate guarantee, the same
 * fallback `flattenTree` already applies) is treated as its own root here
 * too — `flattenTree` re-parents it to depth 0, so reusing that same set of
 * depth-0 ids as "roots" costs nothing extra and never disagrees with it.
 */
function computeRows(nodes: readonly WhyWhyNode[]): ReadonlyMap<string, number> {
  const rows = new Map<string, number>();
  let nextLeafRow = 0;

  function assign(nodeId: string): number {
    const cached = rows.get(nodeId);
    if (cached !== undefined) {
      return cached;
    }
    const children = childrenOf(nodes, nodeId);
    const row =
      children.length === 0
        ? nextLeafRow++
        : children.reduce((sum, child) => sum + assign(child.id), 0) / children.length;
    rows.set(nodeId, row);
    return row;
  }

  const rootIds = flattenTree(nodes)
    .filter(({ depth }) => depth === 0)
    .map(({ node }) => node.id);

  for (const rootId of rootIds) {
    assign(rootId);
  }

  return rows;
}

/**
 * Pure — used by both the interactive Editor and the off-screen rasterizer
 * (D-102), so the exported diagram is never a different layout than the one
 * the user edited. `rootLabel` (P-34's own pattern) is the block's own
 * problem statement, carried by a single anchor node every top-level why
 * branches from; omit it (or pass `""`) for a blank anchor, which is all the
 * interactive Editor has to offer since `MethodEditorProps` carries no entry
 * title.
 */
export function computeWhyWhyTreeLayout(payload: WhyWhyTreePayload, rootLabel = ""): WhyWhyTreeLayout {
  const whyNodes = payload.nodes;
  const rows = computeRows(whyNodes);
  const knNumbers = confirmedRootCauseNumbers(whyNodes);
  const flattened = flattenTree(whyNodes);
  const rootIds = flattened.filter(({ depth }) => depth === 0).map(({ node }) => node.id);

  const nodes: WhyWhyTreeNode[] = [];
  const edges: WhyWhyTreeEdge[] = [];

  for (const { node, depth } of flattened) {
    const row = rows.get(node.id) ?? 0;
    const outcome = visibleOutcome(whyNodes, node);
    const label = outcomeLabel(outcome, knNumbers.get(node.id));
    nodes.push({
      id: node.id,
      position: { x: ROOT_X + (depth + 1) * COLUMN_SPACING_X, y: row * ROW_SPACING_Y },
      data: {
        kind: "node",
        label: node.text,
        // exactOptionalPropertyTypes: omit the key rather than assign `undefined` (same convention as `renderCountermeasureToA3`'s conditional `tone`).
        ...(outcome !== undefined ? { outcome } : {}),
        ...(label !== undefined ? { outcomeLabel: label } : {}),
      },
      draggable: false,
      selectable: false,
    });

    if (node.parentId !== null) {
      edges.push({ id: `${node.parentId}-to-${node.id}`, source: node.parentId, target: node.id });
    }
  }

  if (rootIds.length > 0) {
    const rootRows = rootIds.map((id) => rows.get(id) ?? 0);
    const anchorRow = rootRows.reduce((sum, r) => sum + r, 0) / rootRows.length;
    nodes.push({
      id: "root",
      position: { x: ROOT_X, y: anchorRow * ROW_SPACING_Y },
      data: { kind: "root", label: rootLabel },
      draggable: false,
      selectable: false,
    });
    for (const rootId of rootIds) {
      edges.push({ id: `root-to-${rootId}`, source: "root", target: rootId });
    }
  }

  return { nodes, edges };
}
