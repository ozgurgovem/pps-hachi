import { z } from "zod";

/** SPEC.md §1.3 (Step 7): "Realized cost-benefit." Loose per D-51. */
export const RealizedCostBenefitPayloadSchema = z.looseObject({
  realizedBenefit: z.string(),
  actualCost: z.string(),
  netBenefit: z.string(),
  notes: z.string(),
});

export type RealizedCostBenefitPayload = z.infer<typeof RealizedCostBenefitPayloadSchema>;
