import { z } from "zod";

/**
 * SPEC.md §1.3 (Step 1): Containment / Interim Containment Action (ICA) —
 * automotive; a variable-length log of containment actions, each with an
 * effectiveness check, start date and exit criteria. D-115: uses the shared
 * row-table substrate. Loose per D-51.
 */
export const ContainmentIcaRowSchema = z.looseObject({
  id: z.string(),
  action: z.string(),
  owner: z.string(),
  startDate: z.string(),
  effectivenessCheck: z.string(),
  exitCriteria: z.string(),
});

export const ContainmentIcaPayloadSchema = z.looseObject({
  rows: z.array(ContainmentIcaRowSchema),
});

export type ContainmentIcaRow = z.infer<typeof ContainmentIcaRowSchema>;
export type ContainmentIcaPayload = z.infer<typeof ContainmentIcaPayloadSchema>;
