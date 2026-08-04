import { z } from "zod";

/**
 * SPEC.md §1.3 (Step 6): action plan. One action per entry — see
 * `fields.ts` for why.
 *
 * The **Gantt** half of §1.3's "Action plan table / Gantt" is deliberately
 * not built here: a bar-per-action timeline is a new `ChartSpec` variant,
 * and D-114 caps a slice at one new mechanism (6b's is the cross-step
 * reference subsystem). The dates are recorded in the schema, so the chart
 * can be added later without a migration. Flagged, not dropped.
 *
 * Loose per D-51.
 */
export const ActionItemPayloadSchema = z.looseObject({
  action: z.string(),
  owner: z.string(),
  startDate: z.string(),
  dueDate: z.string(),
  percentComplete: z.string(),
  evidence: z.string(),
});

export type ActionItemPayload = z.infer<typeof ActionItemPayloadSchema>;
