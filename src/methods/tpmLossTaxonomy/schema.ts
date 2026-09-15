import { z } from "zod";
import { TPM_LOSS_SEVERITIES } from "./categories";

/**
 * SPEC.md §3.0: eight fixed TPM loss categories (Work Safety, Cost,
 * Productivity, Quality, Autonomous Maintenance, Professional Maintenance,
 * Human Resources, Environment — D-267/P-66), each tagged with whether it
 * applies and, if so, its severity. Categories are fixed domain fields
 * (like `isIsNot`'s four dimensions), not a user-added list — no row table
 * here. Loose per D-51.
 */
export const TpmLossTagSchema = z.looseObject({
  applies: z.boolean(),
  severity: z.enum(TPM_LOSS_SEVERITIES),
});

export type TpmLossTag = z.infer<typeof TpmLossTagSchema>;

export const TpmLossTaxonomyPayloadSchema = z.looseObject({
  workSafety: TpmLossTagSchema,
  cost: TpmLossTagSchema,
  productivity: TpmLossTagSchema,
  quality: TpmLossTagSchema,
  autonomousMaintenance: TpmLossTagSchema,
  professionalMaintenance: TpmLossTagSchema,
  humanResources: TpmLossTagSchema,
  environment: TpmLossTagSchema,
});

export type TpmLossTaxonomyPayload = z.infer<typeof TpmLossTaxonomyPayloadSchema>;
