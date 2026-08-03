import { z } from "zod";

/** SPEC.md §1.3 (Step 2): time series with a target line and event markers. */
export const TrendPointSchema = z.looseObject({
  id: z.string(),
  label: z.string(),
  value: z.number(),
});

export const TrendEventSchema = z.looseObject({
  label: z.string(),
  /** Must match a point's `label` — where the marker lands on the x-axis. */
  at: z.string(),
});

export const TrendPayloadSchema = z.looseObject({
  unit: z.string(),
  points: z.array(TrendPointSchema),
  targetValue: z.number().optional(),
  targetLabel: z.string().optional(),
  events: z.array(TrendEventSchema),
});

export type TrendPoint = z.infer<typeof TrendPointSchema>;
export type TrendEvent = z.infer<typeof TrendEventSchema>;
export type TrendPayload = z.infer<typeof TrendPayloadSchema>;
