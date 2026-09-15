import "@xyflow/react/dist/style.css";
import { Background, ReactFlow, ReactFlowProvider, type NodeChange } from "@xyflow/react";
import { useTranslation } from "react-i18next";
import type { A3ImageSize, A3Language } from "../../a3/methodContract";
import { CATEGORY_EXPORT_LABELS, categoryLabelKey } from "./categories";
import { computeFishboneLayout, type FishboneNode } from "./layout";
import type { FishbonePayload } from "./schema";

interface FishboneDiagramProps {
  readonly payload: FishbonePayload;
  /** Editor mode: causes are draggable, the canvas pans/zooms, the grid shows. */
  readonly interactive?: boolean;
  readonly onCausePositionChange?: (causeId: string, position: { x: number; y: number }) => void;
  /**
   * P-34: the block's own problem statement, shown in the diagram's new
   * terminal effect node. The interactive Editor has no entry title to pass
   * (`MethodEditorProps` is payload-only) and falls back to a placeholder;
   * the exported diagram always receives the real title (`renderToA3.ts`).
   */
  readonly effectLabel?: string;
  /**
   * Rasterizer mode (D-102): the explicit pixel box to draw into. Omitted in
   * the editor, where the surrounding CSS box supplies the size. React Flow
   * paints nothing in a zero-sized container, so the off-screen capture path
   * must never rely on inherited layout — see `src/a3/render/rasterize.ts`.
   */
  readonly size?: A3ImageSize;
  /**
   * P-42: when set (rasterizer mode, `renderFishboneToA3.ts`'s own
   * `resolveA3Language(entry)`), category labels resolve against this
   * static, `project.meta.language`-driven dictionary instead of the
   * editor's live `t()` — the two can diverge (UI in Turkish, project
   * content in English) and the exported diagram must follow the latter,
   * same as every other method D-188 already covers. Omitted in the
   * interactive Editor, where the live UI language is exactly what should
   * show.
   */
  readonly language?: A3Language;
}

function nodeLabel(node: FishboneNode, translate: (key: string) => string, language: A3Language | undefined): string {
  if (node.data.kind === "category") {
    const categoryId = node.data.label ?? "";
    if (language) {
      return CATEGORY_EXPORT_LABELS[categoryId]?.[language] ?? categoryId;
    }
    return translate(categoryLabelKey(categoryId));
  }
  if (node.data.kind === "effect" && (node.data.label ?? "").trim().length === 0) {
    return translate("methods.fishbone.effectPlaceholder");
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
  effectLabel,
  size,
  language,
}: FishboneDiagramProps) {
  const { t } = useTranslation();
  const layout = computeFishboneLayout(payload, effectLabel ?? "");

  const nodes = layout.nodes.map((node) => ({
    ...node,
    data: { ...node.data, label: nodeLabel(node, t, language) },
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
