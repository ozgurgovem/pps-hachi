import { z } from "zod";

/**
 * SPEC.md §1.3 (Step 5): "Impact / Effort matrix (2×2, drag-and-drop)."
 * Built as a scored list with a computed quadrant instead — the same
 * simplification `causeEffectMatrix` (6b) already made for "matrix": a
 * ranked/quadrant list on the A3 sheet, not a literal draggable grid in the
 * app. True free-position drag placement is a real, documented gap (P-27),
 * not a silent drop. Scores stay `string`-typed per D-120, parsed at
 * render time in `quadrant.ts`.
 */
export const ImpactEffortItemSchema = z.looseObject({
  id: z.string(),
  description: z.string(),
  impact: z.string(),
  effort: z.string(),
});

export const ImpactEffortMatrixPayloadSchema = z.looseObject({
  items: z.array(ImpactEffortItemSchema),
});

export type ImpactEffortItem = z.infer<typeof ImpactEffortItemSchema>;
export type ImpactEffortMatrixPayload = z.infer<typeof ImpactEffortMatrixPayloadSchema>;
