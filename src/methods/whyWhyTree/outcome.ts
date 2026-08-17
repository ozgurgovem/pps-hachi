import { childrenOf, flattenTree } from "../shared/nodeTree";
import type { WhyWhyNode, WhyWhyOutcome } from "./schema";

/**
 * The real form only ever marks a chain's *end* — a node with children is a
 * mid-chain reasoning step, not a terminal cause. A node can carry a stale
 * `outcome` from when it used to be a leaf (§2.2: gaining a child does not
 * clear the field, no data loss), so every consumer must check leaf-ness
 * through this function rather than reading `node.outcome` directly.
 */
export function visibleOutcome(nodes: readonly WhyWhyNode[], node: WhyWhyNode): WhyWhyOutcome | undefined {
  if (childrenOf(nodes, node.id).length > 0) {
    return undefined;
  }
  return node.outcome as WhyWhyOutcome | undefined;
}

/**
 * KN{N} numbering, derived — never stored (D-71). Confirmed-root-cause
 * leaves are numbered by their position in `flattenTree`'s depth-first
 * order, the same order the Editor and `treeLines` already walk, so the
 * Editor and the exported diagram can never disagree on which KN is which
 * (the same discipline Fishbone's `effectLabel` already established, P-34).
 */
export function confirmedRootCauseNumbers(nodes: readonly WhyWhyNode[]): ReadonlyMap<string, number> {
  const numbers = new Map<string, number>();
  let counter = 0;

  for (const { node } of flattenTree(nodes)) {
    if (visibleOutcome(nodes, node) === "confirmedRootCause") {
      counter += 1;
      numbers.set(node.id, counter);
    }
  }

  return numbers;
}
