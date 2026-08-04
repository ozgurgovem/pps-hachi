import { z } from "zod";

/**
 * SPEC.md §1.3 (Step 2): Point of Cause nomination — the mandatory output of
 * Step 2 and the head of the traceability chain `SPEC.md` §4.2 describes
 * (root cause → point of cause → …).
 *
 * Holds no `references[]` of its own: it is the chain's *origin*, so it is
 * what other entries target, never a referrer. D-116's `pointOfCause` role
 * names this entry as a target. Loose per D-51.
 */
export const PointOfCausePayloadSchema = z.looseObject({
  processStep: z.string(),
  location: z.string(),
  occursWhen: z.string(),
  evidence: z.string(),
  observedAt: z.string(),
  observedBy: z.string(),
});

export type PointOfCausePayload = z.infer<typeof PointOfCausePayloadSchema>;
