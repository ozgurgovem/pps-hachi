import { z } from "zod";

/**
 * SPEC.md §1.3 (Step 4): Cause & Effect (X-Y) matrix — process inputs (X)
 * scored against weighted customer outputs (Y), ranked by the weighted total.
 *
 * This is the one 6b method that computes on its own fields, which D-120
 * anticipated: "a method that needs to aggregate can layer its own numeric
 * parsing over the still-string-typed field without changing the shared
 * substrate". Values stay `string` in the schema — an in-progress "1" typed
 * toward "12" must round-trip, and a blank cell must stay blank rather than
 * becoming `0` — and `scoreValue` does the parsing at render time.
 *
 * `scores` is keyed by output id, so deleting an output leaves stale keys on
 * the inputs; `weightedTotal` reads only the outputs that still exist, which
 * is the same derive-don't-store posture as D-117.
 */
export const CauseEffectOutputSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  weight: z.string(),
});

export const CauseEffectInputSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  scores: z.record(z.string(), z.string()),
});

export const CauseEffectMatrixPayloadSchema = z.looseObject({
  outputs: z.array(CauseEffectOutputSchema),
  inputs: z.array(CauseEffectInputSchema),
});

export type CauseEffectOutput = z.infer<typeof CauseEffectOutputSchema>;
export type CauseEffectInput = z.infer<typeof CauseEffectInputSchema>;
export type CauseEffectMatrixPayload = z.infer<typeof CauseEffectMatrixPayloadSchema>;
