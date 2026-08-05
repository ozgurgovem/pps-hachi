import { z } from "zod";

/**
 * SPEC.md §1.3 (Step 2): "Histogram / scatter / box plot" — one method, one
 * user-picked `chartType`, per `chartSpec.ts`'s Phase 6c comment. `samples`
 * feeds histogram/box-plot (a single numeric column); `points` feeds
 * scatter (paired x/y). Both lists always exist on the payload — only the
 * one matching `chartType` is shown in the editor or rendered, the same
 * "keep the unused shape around, don't lose data on a chartType switch"
 * posture as D-58's `roundId`. Values stay `string`-typed per D-120; parsed
 * at render time in `stats.ts`, mirroring `causeEffectMatrix/score.ts`.
 */
export const DISTRIBUTION_CHART_TYPES = ["histogram", "scatter", "box-plot"] as const;
export type DistributionChartType = (typeof DISTRIBUTION_CHART_TYPES)[number];

export const DistributionSampleSchema = z.looseObject({
  id: z.string(),
  value: z.string(),
});

export const DistributionPointSchema = z.looseObject({
  id: z.string(),
  x: z.string(),
  y: z.string(),
});

export const DistributionChartPayloadSchema = z.looseObject({
  chartType: z.enum(DISTRIBUTION_CHART_TYPES),
  unit: z.string(),
  /** Blank means "use Sturges' rule" — see `stats.ts`. String per D-120. */
  binCount: z.string(),
  samples: z.array(DistributionSampleSchema),
  points: z.array(DistributionPointSchema),
});

export type DistributionSample = z.infer<typeof DistributionSampleSchema>;
export type DistributionPoint = z.infer<typeof DistributionPointSchema>;
export type DistributionChartPayload = z.infer<typeof DistributionChartPayloadSchema>;
