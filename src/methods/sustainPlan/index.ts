import { emptyFieldFormValues } from "../shared/fieldForm";
import type { MethodPlugin } from "../types";
import { SustainPlanEditor } from "./Editor";
import { SUSTAIN_PLAN_FIELDS } from "./fields";
import { renderSustainPlanToA3 } from "./renderToA3";
import { SustainPlanPayloadSchema, type SustainPlanPayload } from "./schema";

export const SUSTAIN_PLAN_METHOD_ID = "sustain-plan";

export const sustainPlanMethod: MethodPlugin<SustainPlanPayload> = {
  id: SUSTAIN_PLAN_METHOD_ID,
  steps: [8],
  nameKey: "methods.sustainPlan.name",
  useWhenKey: "methods.sustainPlan.useWhen",
  schema: SustainPlanPayloadSchema,
  Editor: SustainPlanEditor,
  createEmptyPayload: () => emptyFieldFormValues(SUSTAIN_PLAN_FIELDS),
  renderToA3: renderSustainPlanToA3,
};
