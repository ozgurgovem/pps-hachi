import { emptyFieldFormValues } from "../shared/fieldForm";
import type { MethodPlugin } from "../types";
import { PointOfCauseEditor } from "./Editor";
import { POINT_OF_CAUSE_FIELDS } from "./fields";
import { renderPointOfCauseToA3 } from "./renderToA3";
import { PointOfCausePayloadSchema, type PointOfCausePayload } from "./schema";

export const POINT_OF_CAUSE_METHOD_ID = "point-of-cause";

export const pointOfCauseMethod: MethodPlugin<PointOfCausePayload> = {
  id: POINT_OF_CAUSE_METHOD_ID,
  steps: [2],
  nameKey: "methods.pointOfCause.name",
  useWhenKey: "methods.pointOfCause.useWhen",
  schema: PointOfCausePayloadSchema,
  Editor: PointOfCauseEditor,
  createEmptyPayload: () => emptyFieldFormValues(POINT_OF_CAUSE_FIELDS),
  renderToA3: renderPointOfCauseToA3,
  aiProposal: { promptVersion: "v1" },
};
