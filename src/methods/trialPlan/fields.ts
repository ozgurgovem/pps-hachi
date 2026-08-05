import type { FieldFormField } from "../shared/fieldForm";

export type TrialPlanFieldKey = "scope" | "duration" | "sampleSize" | "acceptanceCriteria";

/** SPEC.md §1.3 (Step 5): "Trial plan (scope, duration, sample size, acceptance criteria)." */
export const TRIAL_PLAN_FIELDS = [
  { key: "scope", labelKey: "methods.trialPlan.fields.scope", exportLabel: "Scope", type: "textarea", wide: true },
  { key: "duration", labelKey: "methods.trialPlan.fields.duration", exportLabel: "Duration", type: "text" },
  { key: "sampleSize", labelKey: "methods.trialPlan.fields.sampleSize", exportLabel: "Sample size", type: "text" },
  {
    key: "acceptanceCriteria",
    labelKey: "methods.trialPlan.fields.acceptanceCriteria",
    exportLabel: "Acceptance criteria",
    type: "textarea",
    wide: true,
  },
] as const satisfies readonly FieldFormField<TrialPlanFieldKey>[];
