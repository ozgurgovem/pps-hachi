import { createElement } from "react";
import type { MethodPlugin } from "../types";
import { AnnotatedPhotoCanvas } from "../shared/AnnotatedPhotoCanvas";
import type { AnnotatedPhotoRenderSpec } from "../shared/annotatedPhoto";
import { DefectPhotoBoardEditor } from "./Editor";
import { renderDefectPhotoBoardToA3 } from "./renderToA3";
import { DefectPhotoBoardPayloadSchema, type DefectPhotoBoardPayload } from "./schema";

export const DEFECT_PHOTO_BOARD_METHOD_ID = "defect-photo-board";

/**
 * D-119/6e-2: the "annotated-photo" `imageKind`/`renderImage` pair is
 * registered here only — `spaghetti-diagram`/`value-stream-map` share this
 * exact renderer via `getA3ImageRendererMap()`'s kind-string dispatch,
 * `problem-impact` reusing `pareto`'s renderer is the same precedent (C2).
 */
export const defectPhotoBoardMethod: MethodPlugin<DefectPhotoBoardPayload> = {
  id: DEFECT_PHOTO_BOARD_METHOD_ID,
  steps: [1],
  nameKey: "methods.defectPhotoBoard.name",
  useWhenKey: "methods.defectPhotoBoard.useWhen",
  schema: DefectPhotoBoardPayloadSchema,
  Editor: DefectPhotoBoardEditor,
  createEmptyPayload: () => ({}),
  renderToA3: renderDefectPhotoBoardToA3,
  imageSlots: [{ labelKey: "methods.defectPhotoBoard.photoLabel", max: 1, annotatable: true }],
  imageKind: "annotated-photo",
  renderImage: (spec, size) => {
    const { photoDataUrl, mimeType, annotations } = spec as AnnotatedPhotoRenderSpec;
    return createElement(AnnotatedPhotoCanvas, { photoDataUrl, mimeType, annotations, size });
  },
};
