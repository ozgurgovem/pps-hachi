import type { Edge, Node } from "@xyflow/react";
import { FISHBONE_CATEGORY_IDS } from "./categories";
import type { FishboneCause, FishbonePayload } from "./schema";

const SPINE_Y = 220;
const SPINE_START_X = 120;
const CATEGORY_SPACING_X = 160;
/**
 * P-34: a branch runs diagonally out of the spine (classic Ishikawa), not
 * straight up/down. Equal to `BRANCH_OFFSET_Y` for a ~45° angle, offset
 * toward decreasing x — away from the effect node at the spine's far end —
 * so every bone visually points toward the head, the same direction the
 * reference photo (D-175) draws them.
 */
const BRANCH_OFFSET_X = 90;
const BRANCH_OFFSET_Y = 90;
const CAUSE_OFFSET_X = 24;
/** Distance from the last spine anchor to the terminal effect node. */
const EFFECT_OFFSET_X = 180;

export interface FishboneNodeData extends Record<string, unknown> {
  readonly kind: "spineAnchor" | "category" | "cause" | "effect";
  readonly label?: string;
}

export type FishboneNode = Node<FishboneNodeData>;
export type FishboneEdge = Edge;

export interface FishboneLayout {
  readonly nodes: readonly FishboneNode[];
  readonly edges: readonly FishboneEdge[];
}

/** What `renderFishboneToA3.ts` hands to the off-screen rasterizer (D-102) — the payload plus the block's own problem statement for the new terminal effect node (P-34). */
export interface FishboneImageSpec {
  readonly payload: FishbonePayload;
  readonly effectLabel: string;
}

function causesInCategory(causes: readonly FishboneCause[], categoryId: string): readonly FishboneCause[] {
  return causes.filter((cause) => cause.categoryId === categoryId && !cause.parentCauseId);
}

function subCausesOf(causes: readonly FishboneCause[], parentCauseId: string): readonly FishboneCause[] {
  return causes.filter((cause) => cause.parentCauseId === parentCauseId);
}

/**
 * D-103: pure — category positions are always computed (never persisted),
 * cause positions use a stored override when present and fall back to a
 * deterministic stack near their category otherwise. Used by both the
 * interactive Editor and the off-screen rasterizer (D-102) so the exported
 * diagram is never a different layout than the one the user edited.
 *
 * `effectLabel` (P-34) is the block's own problem statement, carried by the
 * new terminal node at the spine's far end — omit it (or pass `""`) for a
 * blank effect box, which is all the interactive Editor has to offer since
 * `MethodEditorProps` carries no entry title.
 */
export function computeFishboneLayout(payload: FishbonePayload, effectLabel = ""): FishboneLayout {
  const categoryIds = FISHBONE_CATEGORY_IDS[payload.categorySet];
  const nodes: FishboneNode[] = [];
  const edges: FishboneEdge[] = [];

  const spineAnchorIds = categoryIds.map((categoryId, index) => {
    const anchorId = `spine-${categoryId}`;
    nodes.push({
      id: anchorId,
      position: { x: SPINE_START_X + index * CATEGORY_SPACING_X, y: SPINE_Y },
      data: { kind: "spineAnchor" },
      draggable: false,
      selectable: false,
      style: { width: 1, height: 1, opacity: 0 },
    });
    return anchorId;
  });

  for (let i = 0; i < spineAnchorIds.length - 1; i += 1) {
    edges.push({
      id: `spine-${i}`,
      source: spineAnchorIds[i]!,
      target: spineAnchorIds[i + 1]!,
      type: "straight",
    });
  }

  categoryIds.forEach((categoryId, index) => {
    const above = index % 2 === 0;
    const spineAnchorX = SPINE_START_X + index * CATEGORY_SPACING_X;
    // P-34: diagonal, not vertical — offset toward decreasing x (away from
    // the effect node) so the bone points toward the head, same as the
    // approved reference (D-175).
    const categoryX = spineAnchorX - BRANCH_OFFSET_X;
    const categoryY = SPINE_Y + (above ? -BRANCH_OFFSET_Y : BRANCH_OFFSET_Y);
    const categoryNodeId = `category-${categoryId}`;

    nodes.push({
      id: categoryNodeId,
      position: { x: categoryX, y: categoryY },
      data: { kind: "category", label: categoryId },
      draggable: false,
    });
    edges.push({ id: `spine-to-${categoryId}`, source: `spine-${categoryId}`, target: categoryNodeId });

    const categoryCauses = causesInCategory(payload.causes, categoryId);
    categoryCauses.forEach((cause, causeIndex) => {
      const causeNodeId = `cause-${cause.id}`;
      // P-34: a cause sits on the branch line itself, strictly between the
      // spine and the category box — never farther out than the category,
      // which is the diagonal's own outer tip.
      const fraction = (causeIndex + 1) / (categoryCauses.length + 1);
      const baseX = spineAnchorX + (categoryX - spineAnchorX) * fraction;
      const baseY = SPINE_Y + (categoryY - SPINE_Y) * fraction;
      const defaultPosition = {
        x: baseX + (causeIndex % 2 === 0 ? -CAUSE_OFFSET_X : CAUSE_OFFSET_X),
        y: baseY,
      };
      nodes.push({
        id: causeNodeId,
        position: cause.position ?? defaultPosition,
        data: { kind: "cause", label: cause.text },
      });
      edges.push({ id: `${categoryNodeId}-to-${causeNodeId}`, source: categoryNodeId, target: causeNodeId });

      subCausesOf(payload.causes, cause.id).forEach((subCause, subIndex) => {
        const subCauseNodeId = `cause-${subCause.id}`;
        // One notch further from the spine than the parent cause, still
        // capped short of the category itself.
        const subFraction = Math.min(fraction + 0.2, 0.9);
        const subBaseX = spineAnchorX + (categoryX - spineAnchorX) * subFraction;
        const subBaseY = SPINE_Y + (categoryY - SPINE_Y) * subFraction;
        const subDefaultPosition = {
          x: subBaseX + (subIndex % 2 === 0 ? -CAUSE_OFFSET_X : CAUSE_OFFSET_X),
          y: subBaseY,
        };
        nodes.push({
          id: subCauseNodeId,
          position: subCause.position ?? subDefaultPosition,
          data: { kind: "cause", label: subCause.text },
        });
        edges.push({
          id: `${causeNodeId}-to-${subCauseNodeId}`,
          source: causeNodeId,
          target: subCauseNodeId,
        });
      });
    });
  });

  // P-34: a terminal effect node at the spine's far end, carrying the
  // block's own problem statement — today that text lives only in the
  // block's separate bold title line, outside the diagram itself.
  const lastSpineAnchorId = spineAnchorIds[spineAnchorIds.length - 1];
  if (lastSpineAnchorId) {
    const effectX = SPINE_START_X + (categoryIds.length - 1) * CATEGORY_SPACING_X + EFFECT_OFFSET_X;
    nodes.push({
      id: "effect",
      position: { x: effectX, y: SPINE_Y },
      data: { kind: "effect", label: effectLabel },
      draggable: false,
      selectable: false,
    });
    edges.push({ id: "spine-to-effect", source: lastSpineAnchorId, target: "effect", type: "straight" });
  }

  return { nodes, edges };
}
