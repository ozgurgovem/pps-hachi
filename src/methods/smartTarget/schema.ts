import { z } from "zod";

/**
 * SPEC.md §1.3 (Step 3) + D-38's three-zone strip: SMART fields (metric,
 * baseline, target, unit, due date, owner), prioritised target items (zone
 * A), and a stakeholder alignment note. Loose per D-51.
 */
export const SmartTargetItemSchema = z.looseObject({
  id: z.string(),
  text: z.string(),
});

export const SmartTargetPayloadSchema = z.looseObject({
  metric: z.string(),
  baseline: z.number(),
  target: z.number(),
  unit: z.string(),
  dueDate: z.string(),
  owner: z.string(),
  prioritizedItems: z.array(SmartTargetItemSchema),
  stakeholderNote: z.string(),
});

export type SmartTargetItem = z.infer<typeof SmartTargetItemSchema>;
export type SmartTargetPayload = z.infer<typeof SmartTargetPayloadSchema>;
