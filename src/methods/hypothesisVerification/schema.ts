import { z } from "zod";

/**
 * SPEC.md §1.3 (Step 4): hypothesis verification table. D-115's row-table
 * substrate — one row per candidate cause. `verdict` stays a plain string
 * (not `z.enum`) for the same reason D-116's `role` does: a newer build that
 * adds a fourth verdict must round-trip through this one untouched, and D-51
 * makes loose-by-default the house rule.
 *
 * The entry carries the `pointOfCause` reference (SPEC.md §4.2, "a root cause
 * holds `pointOfCauseId`") on `Entry.references[]`, **not** in this payload —
 * D-116. One table verifies causes for one nominated point of cause, which is
 * why that role is single-valued.
 */
export const HypothesisVerificationRowSchema = z.looseObject({
  id: z.string(),
  candidateCause: z.string(),
  verificationMethod: z.string(),
  evidence: z.string(),
  verdict: z.string(),
  /**
   * §13.4 candidate 5 (`reference/TEMPLATE_ANALYSIS.md`, Oturum C/C1): three
   * fields the reference form's root-cause verification table carries that
   * this table didn't. `confidencePercent` stays a plain string per D-120 —
   * the table is still read row by row, nothing sums or plots it.
   */
  confidencePercent: z.string(),
  residualUncertainty: z.string(),
  customerRelevance: z.string(),
});

export const HypothesisVerificationPayloadSchema = z.looseObject({
  rows: z.array(HypothesisVerificationRowSchema),
});

export type HypothesisVerificationRow = z.infer<typeof HypothesisVerificationRowSchema>;
export type HypothesisVerificationPayload = z.infer<typeof HypothesisVerificationPayloadSchema>;
