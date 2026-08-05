import { z } from "zod";

/** SPEC.md §1.3 (Step 6): trial result log — one row per logged result. D-115. Loose per D-51. */
export const TrialResultLogRowSchema = z.looseObject({
  id: z.string(),
  date: z.string(),
  result: z.string(),
  note: z.string(),
});

export const TrialResultLogPayloadSchema = z.looseObject({
  rows: z.array(TrialResultLogRowSchema),
});

export type TrialResultLogRow = z.infer<typeof TrialResultLogRowSchema>;
export type TrialResultLogPayload = z.infer<typeof TrialResultLogPayloadSchema>;
