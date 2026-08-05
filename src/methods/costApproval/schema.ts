import { z } from "zod";

/**
 * SPEC.md §1.3 (Step 5): "Cost & approval fields." A separate method rather
 * than fields added to `countermeasure`'s already-shipped schema (Barış's
 * call, 2026-08-05) — keeps 6b's file untouched, per D-07's "adding a
 * method must never require touching" other code. `approvalStatus` stays a
 * plain string, not `z.enum`, same reasoning as `countermeasure/schema.ts`'s
 * `status`. Loose per D-51.
 */
export const CostApprovalPayloadSchema = z.looseObject({
  costEstimate: z.string(),
  approvalStatus: z.string(),
  approvedBy: z.string(),
  approvalDate: z.string(),
});

export type CostApprovalPayload = z.infer<typeof CostApprovalPayloadSchema>;
