import type { Edge, Node } from "@xyflow/react";
import { FISHBONE_CATEGORY_IDS } from "./categories";
import type { FishboneCause, FishbonePayload } from "./schema";

const SPINE_Y = 220;
const SPINE_START_X = 120;
const CATEGORY_SPACING_X = 160;
const BRANCH_OFFSET_Y = 90;
const CAUSE_SPACING_Y = 46;
const CAUSE_OFFSET_X = 70;

export interface FishboneNodeData extends Record<string, unknown> {
  readonly kind: "spineAnchor" | "category" | "cause";
  readonly label?: string;
}

export type FishboneNode = Node<FishboneNodeData>;
export type FishboneEdge = Edge;

export interface FishboneLayout {
  readonly nodes: readonly FishboneNode[];
  readonly edges: readonly FishboneEdge[];
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
 */
export function computeFishboneLayout(payload: FishbonePayload): FishboneLayout {
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
    const categoryX = SPINE_START_X + index * CATEGORY_SPACING_X;
    const categoryY = SPINE_Y + (above ? -BRANCH_OFFSET_Y : BRANCH_OFFSET_Y);
    const categoryNodeId = `category-${categoryId}`;

    nodes.push({
      id: categoryNodeId,
      position: { x: categoryX, y: categoryY },
      data: { kind: "category", label: categoryId },
      draggable: false,
    });
    edges.push({ id: `spine-to-${categoryId}`, source: `spine-${categoryId}`, target: categoryNodeId });

    const directionY = above ? -1 : 1;
    causesInCategory(payload.causes, categoryId).forEach((cause, causeIndex) => {
      const causeNodeId = `cause-${cause.id}`;
      const defaultPosition = {
        x: categoryX + (causeIndex % 2 === 0 ? -CAUSE_OFFSET_X : CAUSE_OFFSET_X),
        y: categoryY + directionY * (CAUSE_SPACING_Y * (causeIndex + 1)),
      };
      nodes.push({
        id: causeNodeId,
        position: cause.position ?? defaultPosition,
        data: { kind: "cause", label: cause.text },
      });
      edges.push({ id: `${categoryNodeId}-to-${causeNodeId}`, source: categoryNodeId, target: causeNodeId });

      subCausesOf(payload.causes, cause.id).forEach((subCause, subIndex) => {
        const subCauseNodeId = `cause-${subCause.id}`;
        const subDefaultPosition = {
          x: defaultPosition.x + (subIndex % 2 === 0 ? -CAUSE_OFFSET_X : CAUSE_OFFSET_X),
          y: defaultPosition.y + directionY * CAUSE_SPACING_Y,
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

  return { nodes, edges };
}
