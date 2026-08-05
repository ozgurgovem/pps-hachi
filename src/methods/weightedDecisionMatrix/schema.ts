import { z } from "zod";

/**
 * SPEC.md §1.3 (Step 5): "Weighted decision matrix (Pugh) for comparing
 * options." Same computed-total shape as `causeEffectMatrix` (6b, Step 4) —
 * criteria with weights, options scored against each. Deliberately its own
 * copy rather than a shared refactor of `causeEffectMatrix/score.ts`: that
 * file already shipped in 6b, and touching already-shipped code from a
 * later slice is exactly what P-23 flags as out of scope for the slice that
 * didn't ship it. Loose per D-51; scores stay `string`-typed per D-120.
 */
export const DecisionCriterionSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  weight: z.string(),
});

export const DecisionOptionSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  scores: z.record(z.string(), z.string()),
});

export const WeightedDecisionMatrixPayloadSchema = z.looseObject({
  criteria: z.array(DecisionCriterionSchema),
  options: z.array(DecisionOptionSchema),
});

export type DecisionCriterion = z.infer<typeof DecisionCriterionSchema>;
export type DecisionOption = z.infer<typeof DecisionOptionSchema>;
export type WeightedDecisionMatrixPayload = z.infer<typeof WeightedDecisionMatrixPayloadSchema>;
