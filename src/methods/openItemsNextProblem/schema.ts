import { z } from "zod";

/**
 * SPEC.md §1.3 (Step 8): "Open items / next problem" — one row per item.
 * D-115. `status` stays a plain string, not `z.enum`, same reasoning as
 * `countermeasure/schema.ts`'s `status`. Loose per D-51.
 */
export const OpenItemsNextProblemRowSchema = z.looseObject({
  id: z.string(),
  description: z.string(),
  owner: z.string(),
  targetDate: z.string(),
  status: z.string(),
});

export const OpenItemsNextProblemPayloadSchema = z.looseObject({
  rows: z.array(OpenItemsNextProblemRowSchema),
});

export type OpenItemsNextProblemRow = z.infer<typeof OpenItemsNextProblemRowSchema>;
export type OpenItemsNextProblemPayload = z.infer<typeof OpenItemsNextProblemPayloadSchema>;
