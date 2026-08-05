import { z } from "zod";

/**
 * SPEC.md §1.3 (Step 6): implementation issues log — one row per issue.
 * D-115. `status` stays a plain string, not `z.enum`, same reasoning as
 * `countermeasure/schema.ts`'s `status`. Loose per D-51.
 */
export const ImplementationIssuesLogRowSchema = z.looseObject({
  id: z.string(),
  date: z.string(),
  issue: z.string(),
  impact: z.string(),
  resolution: z.string(),
  status: z.string(),
});

export const ImplementationIssuesLogPayloadSchema = z.looseObject({
  rows: z.array(ImplementationIssuesLogRowSchema),
});

export type ImplementationIssuesLogRow = z.infer<typeof ImplementationIssuesLogRowSchema>;
export type ImplementationIssuesLogPayload = z.infer<typeof ImplementationIssuesLogPayloadSchema>;
