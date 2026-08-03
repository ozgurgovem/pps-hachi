import { z } from "zod";

/**
 * SPEC.md §1.3 (Step 1): Voice of Customer / complaint record (customer,
 * claim no., part no., PPM, date) — a variable-length log, one row per
 * complaint. D-115: uses the shared row-table substrate. PPM is recorded as
 * text, not computed on, so it stays a plain string like every other
 * row-table field (see `rowTable.ts`). Loose per D-51.
 */
export const VocComplaintRowSchema = z.looseObject({
  id: z.string(),
  customer: z.string(),
  claimNo: z.string(),
  partNo: z.string(),
  ppm: z.string(),
  date: z.string(),
});

export const VocComplaintPayloadSchema = z.looseObject({
  rows: z.array(VocComplaintRowSchema),
});

export type VocComplaintRow = z.infer<typeof VocComplaintRowSchema>;
export type VocComplaintPayload = z.infer<typeof VocComplaintPayloadSchema>;
