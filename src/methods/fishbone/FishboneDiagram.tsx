import "@xyflow/react/dist/style.css";
import { Background, ReactFlow, ReactFlowProvider, type NodeChange } from "@xyflow/react";
import { useTranslation } from "react-i18next";
import type { A3ImageSize } from "../../a3/methodContract";
import { categoryLabelKey } from "./categories";
import { computeFishboneLayout, type FishboneNode } from "./layout";
import type { FishbonePayload } from "./schema";

interface FishboneDiagramProps {
  readonly payload: FishbonePayload;
  /** Editor mode: causes are draggable, the canvas pans/zooms, the grid shows. */
  readonly interactive?: boolean;
  readonly onCausePositionChange?: (causeId: string, position: { x: number; y: number }) => void;
  /**
   * Rasterizer mode (D-102): the explicit pixel box to draw into. Omitted in
   * the editor, where the surrounding CSS box supplies the size. React Flow
   * paints nothing in a zero-sized container, so the off-screen capture path
   * must never rely on inherited layout — see `src/a3/render/rasterize.ts`.
   */
  readonly size?: A3ImageSize;
}

function nodeLabel(node: FishboneNode, translate: (key: string) => string): string {
  if (node.data.kind === "category") {
    return translate(categoryLabelKey(node.data.label ?? ""));
  }
  return node.data.label ?? "";
}

/**
 * D-102/D-103: renders the same node/edge structure the payload describes,
 * whether shown live in the Editor or mounted off-screen for rasterization
 * (`src/a3/render/rasterize.ts`) — one diagram implementation, never two
 * that could drift.
 */
export function FishboneDiagram({
  payload,
  interactive = false,
  onCausePositionChange,
  size,
}: FishboneDiagramProps) {
  const { t } = useTranslation();
  const layout = computeFishboneLayout(payload);

  const nodes = layout.nodes.map((node) => ({
    ...node,
    data: { ...node.data, label: nodeLabel(node, t) },
    draggable: interactive && node.data.kind === "cause",
  }));

  function handleNodesChange(changes: readonly NodeChange[]) {
    if (!interactive || !onCausePositionChange) {
      return;
    }
    for (const change of changes) {
      if (change.type === "position" && change.position && change.id.startsWith("cause-")) {
        onCausePositionChange(change.id.replace(/^cause-/, ""), change.position);
      }
    }
  }

  const wrapperStyle = size
    ? { width: `${size.widthPx}px`, height: `${size.heightPx}px` }
    : { width: "100%", height: "100%" };

  return (
    <div style={wrapperStyle}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={[...layout.edges]}
          onNodesChange={handleNodesChange}
          nodesConnectable={false}
          elementsSelectable={interactive}
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
