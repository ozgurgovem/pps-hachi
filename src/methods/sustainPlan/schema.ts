import { z } from "zod";

/** SPEC.md §1.3 (Step 8): "Sustain plan (audit type, frequency, owner, LPA linkage)." Loose per D-51. */
export const SustainPlanPayloadSchema = z.looseObject({
  auditType: z.string(),
  frequency: z.string(),
  owner: z.string(),
  lpaLinkage: z.string(),
});

export type SustainPlanPayload = z.infer<typeof SustainPlanPayloadSchema>;
