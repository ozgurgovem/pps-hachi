import { z } from "zod";

/**
 * SPEC.md §1.3 (Step 6): ICA → PCA transition tracker. One transition per
 * entry — a project can be retiring several containment actions at once, and
 * each has its own exit criteria and its own pair of links.
 *
 * Loose per D-51.
 */
export const IcaPcaTransitionPayloadSchema = z.looseObject({
  exitCriteria: z.string(),
  verificationEvidence: z.string(),
  plannedRemovalDate: z.string(),
  actualRemovalDate: z.string(),
  owner: z.string(),
  status: z.string(),
});

export type IcaPcaTransitionPayload = z.infer<typeof IcaPcaTransitionPayloadSchema>;
