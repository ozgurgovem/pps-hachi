import { z } from "zod";

/**
 * SPEC.md §1.3 (Step 1): Gap Statement — Ideal / Actual / Gap. Every field is
 * optional text (blank during drafting is normal — D-52 validates at edit
 * time, never load time), loose per D-51.
 *
 * D-196/§1.2 S1: "gap must be quantified (a number + unit + baseline
 * period)" — `gapValue`/`unit`/`baselinePeriod` are that quantification,
 * added beside the free-text `gap` (which stays prose) rather than replacing
 * it, the same additive posture D-38's SMART Target fields already used.
 * `gapValue` is `number` like `smartTarget`'s `baseline`/`target` — the
 * readiness selector treats a default `0` as "not yet filled" (documented on
 * `evaluateReadiness.ts`'s own S1 check), the same accepted heuristic S3
 * already uses for `smartTarget`.
 */
export const GapStatementPayloadSchema = z.looseObject({
  ideal: z.string(),
  actual: z.string(),
  gap: z.string(),
  gapValue: z.number(),
  unit: z.string(),
  baselinePeriod: z.string(),
});

export type GapStatementPayload = z.infer<typeof GapStatementPayloadSchema>;
