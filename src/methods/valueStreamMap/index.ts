import type { MethodPlugin } from "../types";
import { ValueStreamMapEditor } from "./Editor";
import { renderValueStreamMapToA3 } from "./renderToA3";
import { ValueStreamMapPayloadSchema, type ValueStreamMapPayload } from "./schema";

export const VALUE_STREAM_MAP_METHOD_ID = "value-stream-map";

/**
 * D-119/6e-2: reuses `defect-photo-board`'s `"annotated-photo"` renderer via
 * `getA3ImageRendererMap()`'s kind-string dispatch — declares no `imageKind`/
 * `renderImage` of its own, same as `spaghetti-diagram` (C2's own precedent
 * for this reuse shape).
 */
export const valueStreamMapMethod: MethodPlugin<ValueStreamMapPayload> = {
  id: VALUE_STREAM_MAP_METHOD_ID,
  steps: [2],
  nameKey: "methods.valueStreamMap.name",
  useWhenKey: "methods.valueStreamMap.useWhen",
  schema: ValueStreamMapPayloadSchema,
  Editor: ValueStreamMapEditor,
  createEmptyPayload: () => ({}),
  renderToA3: renderValueStreamMapToA3,
  imageSlots: [{ labelKey: "methods.valueStreamMap.photoLabel", max: 1, annotatable: true }],
};
