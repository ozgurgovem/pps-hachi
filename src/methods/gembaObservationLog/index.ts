import { emptyFieldFormValues } from "../shared/fieldForm";
import type { MethodPlugin } from "../types";
import { GembaObservationLogEditor } from "./Editor";
import { GEMBA_OBSERVATION_LOG_FIELDS } from "./fields";
import { renderGembaObservationLogToA3 } from "./renderToA3";
import { GembaObservationLogPayloadSchema, type GembaObservationLogPayload } from "./schema";

export const GEMBA_OBSERVATION_LOG_METHOD_ID = "gemba-observation-log";

export const gembaObservationLogMethod: MethodPlugin<GembaObservationLogPayload> = {
  id: GEMBA_OBSERVATION_LOG_METHOD_ID,
  steps: [2],
  nameKey: "methods.gembaObservationLog.name",
  useWhenKey: "methods.gembaObservationLog.useWhen",
  schema: GembaObservationLogPayloadSchema,
  Editor: GembaObservationLogEditor,
  createEmptyPayload: () => emptyFieldFormValues(GEMBA_OBSERVATION_LOG_FIELDS),
  renderToA3: renderGembaObservationLogToA3,
  imageSlots: [{ labelKey: "methods.gembaObservationLog.photosLabel", max: 1 }],
};
