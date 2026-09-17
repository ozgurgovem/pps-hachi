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
 *
 * ADIM 1 BVVL round (2026-09-16/17): `idealValue`/`actualValue` reverse
 * D-162/D-224's earlier "no numeric fields, no fabricated chart" call —
 * Barış explicitly asked for a real two-bar comparison matching the
 * EK-2905 workbook's own "GAP ANALİZİ" chart, so this dilim adds the two
 * numbers that chart actually needs (matching `smartTarget`'s own
 * `baseline`/`target` naming). `targetDate` mirrors `baselinePeriod`'s role
 * for the ideal bar (`baselinePeriod` already covers the actual bar's own
 * date, reused as-is). These two values drive `GapAnalysisChart` directly;
 * `gapValue` stays untouched (S1's own quantification signal).
 */
export const GapStatementPayloadSchema = z.looseObject({
  ideal: z.string(),
  actual: z.string(),
  gap: z.string(),
  gapValue: z.number(),
  unit: z.string(),
  baselinePeriod: z.string(),
  idealValue: z.number(),
  actualValue: z.number(),
  targetDate: z.string(),
});

export type GapStatementPayload = z.infer<typeof GapStatementPayloadSchema>;
