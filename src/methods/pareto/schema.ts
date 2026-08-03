import { z } from "zod";

/**
 * SPEC.md §1.3 (Step 2): Pareto chart with cumulative % line and 80% cut.
 * Loose per D-51's project-wide convention (see genericText/schema.ts).
 */
export const ParetoCategorySchema = z.looseObject({
  id: z.string(),
  label: z.string(),
  count: z.number(),
});

export const ParetoPayloadSchema = z.looseObject({
  unit: z.string(),
  categories: z.array(ParetoCategorySchema),
});

export type ParetoCategory = z.infer<typeof ParetoCategorySchema>;
export type ParetoPayload = z.infer<typeof ParetoPayloadSchema>;
