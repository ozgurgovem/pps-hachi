import { z } from "zod";

/**
 * SPEC.md §1.3 (Step 2): Is/Is-Not analysis (Kepner-Tregoe grid) — four
 * fixed dimensions (What, Where, When, Extent), each with an IS and an
 * IS NOT column. Loose per D-51.
 */
export const IsIsNotPayloadSchema = z.looseObject({
  whatIs: z.string(),
  whatIsNot: z.string(),
  whereIs: z.string(),
  whereIsNot: z.string(),
  whenIs: z.string(),
  whenIsNot: z.string(),
  extentIs: z.string(),
  extentIsNot: z.string(),
});

export type IsIsNotPayload = z.infer<typeof IsIsNotPayloadSchema>;
