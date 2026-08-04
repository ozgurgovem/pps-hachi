import { z } from "zod";

/**
 * Step 2 category breakdown — see `columns.ts` for why this exists beside
 * Fishbone rather than instead of it. D-115's row-table substrate; every
 * field a string per D-120, `category` included (a closed 5-value set in
 * practice, but not enforced by the schema — D-51's loose-by-default rule,
 * same reasoning as `hypothesisVerification`'s `verdict`).
 */
export const CategoryBreakdownRowSchema = z.looseObject({
  id: z.string(),
  category: z.string(),
  subProblem: z.string(),
  effect: z.string(),
});

export const CategoryBreakdownPayloadSchema = z.looseObject({
  rows: z.array(CategoryBreakdownRowSchema),
});

export type CategoryBreakdownRow = z.infer<typeof CategoryBreakdownRowSchema>;
export type CategoryBreakdownPayload = z.infer<typeof CategoryBreakdownPayloadSchema>;
