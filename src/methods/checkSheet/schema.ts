import { z } from "zod";

/**
 * SPEC.md §1.3 (Step 2): check sheet / tally sheet — one row per tallied
 * item. D-115: uses the shared row-table substrate. Loose per D-51.
 */
export const CheckSheetRowSchema = z.looseObject({
  id: z.string(),
  item: z.string(),
  count: z.string(),
  date: z.string(),
  note: z.string(),
});

export const CheckSheetPayloadSchema = z.looseObject({
  rows: z.array(CheckSheetRowSchema),
});

export type CheckSheetRow = z.infer<typeof CheckSheetRowSchema>;
export type CheckSheetPayload = z.infer<typeof CheckSheetPayloadSchema>;
