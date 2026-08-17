import "@xyflow/react/dist/style.css";
import { Background, ReactFlow, ReactFlowProvider } from "@xyflow/react";
import { useTranslation } from "react-i18next";
import type { A3ImageSize } from "../../a3/methodContract";
import { computeWhyWhyTreeLayout, type WhyWhyTreeNode } from "./layout";
import type { WhyWhyTreePayload } from "./schema";

interface WhyWhyTreeDiagramProps {
  readonly payload: WhyWhyTreePayload;
  /** Editor mode: the canvas pans/zooms and the grid shows. No node is ever draggable — the layout is always auto-computed (D-176: unlike Fishbone's causes, a why-why node carries no stored `position`). */
  readonly interactive?: boolean;
  /**
   * The block's own problem statement, shown in the diagram's root anchor
   * node. The interactive Editor has no entry title to pass
   * (`MethodEditorProps` is payload-only) and falls back to a placeholder;
   * the exported diagram always receives the real title (`renderToA3.ts`).
   */
  readonly rootLabel?: string;
  /**
   * Rasterizer mode (D-102): the explicit pixel box to draw into. Omitted in
   * the editor, where the surrounding CSS box supplies the size — see
   * `src/a3/render/rasterize.ts`.
   */
  readonly size?: A3ImageSize;
}

function nodeLabel(node: WhyWhyTreeNode, translate: (key: string) => string): string {
  if (node.data.kind === "root" && (node.data.label ?? "").trim().length === 0) {
    return translate("methods.whyWhyTree.rootPlaceholder");
  }
  const base = node.data.label ?? "";
  return node.data.outcomeLabel ? `${base}  ${node.data.outcomeLabel}` : base;
}

/**
 * D-102/D-176: renders the same node/edge structure the payload describes,
 * whether shown live in the Editor or mounted off-screen for rasterization
 * (`src/a3/render/rasterize.ts`) — one diagram implementation, never two
 * that could drift. Follows `FishboneDiagram.tsx` closely (this slice's own
 * nearest precedent): plain default React Flow nodes, no custom node type,
 * outcome meaning carried by the label's own ✓/✗ KN{N} suffix rather than by
 * a second, unverified visual-language decision.
 */
export function WhyWhyTreeDiagram({ payload, interactive = false, rootLabel, size }: WhyWhyTreeDiagramProps) {
  const { t } = useTranslation();
  const layout = computeWhyWhyTreeLayout(payload, rootLabel ?? "");

  const nodes = layout.nodes.map((node) => ({
    ...node,
    data: { ...node.data, label: nodeLabel(node, t) },
  }));

  const wrapperStyle = size
    ? { width: `${size.widthPx}px`, height: `${size.heightPx}px` }
    : { width: "100%", height: "100%" };

  return (
    <div style={wrapperStyle}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={[...layout.edges]}
          nodesConnectable={false}
          nodesDraggable={false}
          elementsSelectable={false}
          panOnDrag={interactive}
          zoomOnScroll={interactive}
          zoomOnPinch={interactive}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          {interactive && <Background />}
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
