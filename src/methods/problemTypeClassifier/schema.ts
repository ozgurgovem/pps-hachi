import { z } from "zod";
import { PROBLEM_TYPE_CLASSIFICATIONS } from "./classifications";

/**
 * SPEC.md §1.3 (Step 1): problem type classifier — below standard / raise
 * the standard / inconsistent performance, with a free-text justification.
 * Loose per D-51.
 */
export const ProblemTypeClassifierPayloadSchema = z.looseObject({
  classification: z.enum(PROBLEM_TYPE_CLASSIFICATIONS),
  note: z.string(),
});

export type ProblemTypeClassifierPayload = z.infer<typeof ProblemTypeClassifierPayloadSchema>;
