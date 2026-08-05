import { z } from "zod";

/** SPEC.md §1.3 (Step 5). Loose per D-51. */
export const TrialPlanPayloadSchema = z.looseObject({
  scope: z.string(),
  duration: z.string(),
  sampleSize: z.string(),
  acceptanceCriteria: z.string(),
});

export type TrialPlanPayload = z.infer<typeof TrialPlanPayloadSchema>;
