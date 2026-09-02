import { emptyFieldFormValues } from "../shared/fieldForm";
import type { MethodPlugin } from "../types";
import { TrialPlanEditor } from "./Editor";
import { TRIAL_PLAN_FIELDS } from "./fields";
import { renderTrialPlanToA3 } from "./renderToA3";
import { TrialPlanPayloadSchema, type TrialPlanPayload } from "./schema";

export const TRIAL_PLAN_METHOD_ID = "trial-plan";

export const trialPlanMethod: MethodPlugin<TrialPlanPayload> = {
  id: TRIAL_PLAN_METHOD_ID,
  steps: [5],
  nameKey: "methods.trialPlan.name",
  useWhenKey: "methods.trialPlan.useWhen",
  schema: TrialPlanPayloadSchema,
  Editor: TrialPlanEditor,
  createEmptyPayload: () => emptyFieldFormValues(TRIAL_PLAN_FIELDS),
  renderToA3: renderTrialPlanToA3,
  aiProposal: { promptVersion: "v1" },
};
