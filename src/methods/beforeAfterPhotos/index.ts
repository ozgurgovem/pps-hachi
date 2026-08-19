import type { MethodPlugin } from "../types";
import { BeforeAfterPhotosEditor } from "./Editor";
import { renderBeforeAfterPhotosToA3 } from "./renderToA3";
import { BeforeAfterPhotosPayloadSchema, type BeforeAfterPhotosPayload } from "./schema";

export const BEFORE_AFTER_PHOTOS_METHOD_ID = "before-after-photos";

export const beforeAfterPhotosMethod: MethodPlugin<BeforeAfterPhotosPayload> = {
  id: BEFORE_AFTER_PHOTOS_METHOD_ID,
  steps: [6],
  nameKey: "methods.beforeAfterPhotos.name",
  useWhenKey: "methods.beforeAfterPhotos.useWhen",
  schema: BeforeAfterPhotosPayloadSchema,
  Editor: BeforeAfterPhotosEditor,
  createEmptyPayload: () => ({}),
  renderToA3: renderBeforeAfterPhotosToA3,
  imageSlots: [
    { role: "before", labelKey: "methods.beforeAfterPhotos.beforeLabel", max: 1 },
    { role: "after", labelKey: "methods.beforeAfterPhotos.afterLabel", max: 1 },
  ],
};
