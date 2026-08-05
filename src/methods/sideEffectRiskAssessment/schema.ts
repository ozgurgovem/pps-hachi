import { z } from "zod";

/**
 * SPEC.md §1.3 (Step 5): "Side-effect / risk assessment of the
 * countermeasure itself." One assessment per entry, referencing the
 * countermeasure it evaluates via `REFERENCE_ROLES.countermeasure` (D-116's
 * subsystem, reused rather than a new mechanism — see `index.ts`).
 *
 * `severity` stays a plain string, not `z.enum`, same reasoning as
 * `countermeasure/schema.ts`'s `status`: a newer build's severity value must
 * round-trip through an older one (D-51). Loose per D-51.
 */
export const SideEffectRiskAssessmentPayloadSchema = z.looseObject({
  description: z.string(),
  severity: z.string(),
  mitigation: z.string(),
});

export type SideEffectRiskAssessmentPayload = z.infer<typeof SideEffectRiskAssessmentPayloadSchema>;
