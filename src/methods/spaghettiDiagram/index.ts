import type { MethodPlugin } from "../types";
import { SpaghettiDiagramEditor } from "./Editor";
import { renderSpaghettiDiagramToA3 } from "./renderToA3";
import { SpaghettiDiagramPayloadSchema, type SpaghettiDiagramPayload } from "./schema";

export const SPAGHETTI_DIAGRAM_METHOD_ID = "spaghetti-diagram";

/**
 * D-119/6e-2: reuses `defect-photo-board`'s `"annotated-photo"` renderer via
 * `getA3ImageRendererMap()`'s kind-string dispatch — declares no `imageKind`/
 * `renderImage` of its own (C2's `problem-impact`-reusing-`pareto` precedent).
 */
export const spaghettiDiagramMethod: MethodPlugin<SpaghettiDiagramPayload> = {
  id: SPAGHETTI_DIAGRAM_METHOD_ID,
  steps: [2],
  nameKey: "methods.spaghettiDiagram.name",
  useWhenKey: "methods.spaghettiDiagram.useWhen",
  schema: SpaghettiDiagramPayloadSchema,
  Editor: SpaghettiDiagramEditor,
  createEmptyPayload: () => ({}),
  renderToA3: renderSpaghettiDiagramToA3,
  imageSlots: [{ labelKey: "methods.spaghettiDiagram.photoLabel", max: 1, annotatable: true }],
};
