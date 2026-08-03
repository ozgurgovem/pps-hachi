import { z } from "zod";

/**
 * SPEC.md §1.3 (Step 2): stratification matrix — one row per stratum
 * (line/shift/machine/cavity/operator/supplier/date/product) with an
 * occurrence count. D-115: uses the shared row-table substrate. Loose per
 * D-51.
 */
export const StratificationMatrixRowSchema = z.looseObject({
  id: z.string(),
  line: z.string(),
  shift: z.string(),
  machine: z.string(),
  cavity: z.string(),
  operator: z.string(),
  supplier: z.string(),
  date: z.string(),
  product: z.string(),
  count: z.string(),
});

export const StratificationMatrixPayloadSchema = z.looseObject({
  rows: z.array(StratificationMatrixRowSchema),
});

export type StratificationMatrixRow = z.infer<typeof StratificationMatrixRowSchema>;
export type StratificationMatrixPayload = z.infer<typeof StratificationMatrixPayloadSchema>;
