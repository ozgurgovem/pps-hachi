import { z } from "zod";

/**
 * TEMPLATE_ANALYSIS.md §13.1 (Standardization, Yokoten & Lessons Learned
 * page): horizontal-spread (Yokoten) tracking, one row per site/line/product
 * spread candidate. D-115: uses the shared row-table substrate. Loose per
 * D-51.
 */
export const YokotenTrackerRowSchema = z.looseObject({
  id: z.string(),
  siteLine: z.string(),
  applicability: z.string(),
  riskReviewed: z.string(),
  actionRequired: z.string(),
  owner: z.string(),
  dueDate: z.string(),
  status: z.string(),
  completionEvidence: z.string(),
  effectivenessChecked: z.string(),
  checkDate: z.string(),
  result: z.string(),
  approval: z.string(),
  notes: z.string(),
});

export const YokotenTrackerPayloadSchema = z.looseObject({
  rows: z.array(YokotenTrackerRowSchema),
});

export type YokotenTrackerRow = z.infer<typeof YokotenTrackerRowSchema>;
export type YokotenTrackerPayload = z.infer<typeof YokotenTrackerPayloadSchema>;
