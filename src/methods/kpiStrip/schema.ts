import { z } from "zod";

/**
 * SPEC.md §1.3 (Step 7) / TEMPLATE_ANALYSIS.md §14.3 / DECISIONS.md
 * D-167/D-177/P-36: one KPI item per bullet-graph tile. `status` is a
 * plain user choice (`chartSpec.ts`'s own comment explains why it is not
 * computed from baseline/target/actual). `baseline`/`target`/`actual` stay
 * `number`-typed like `pareto/schema.ts`'s `count` — this data drives the
 * chart directly, nothing is derived from it at render time the way
 * `distributionChart`'s raw samples are. `sustain`/`result` are optional
 * per P-36: both real reference documents leave them blank until the
 * sustainment phase actually happens.
 */
export const KPI_STRIP_STATUSES = ["onTarget", "inProgress", "behind"] as const;
export type KpiStripStatus = (typeof KPI_STRIP_STATUSES)[number];

export const KpiStripItemSchema = z.looseObject({
  id: z.string(),
  label: z.string(),
  unit: z.string(),
  baseline: z.number(),
  target: z.number(),
  actual: z.number(),
  sustain: z.number().optional(),
  result: z.number().optional(),
  status: z.enum(KPI_STRIP_STATUSES),
});

export const KpiStripPayloadSchema = z.looseObject({
  items: z.array(KpiStripItemSchema),
});

export type KpiStripItem = z.infer<typeof KpiStripItemSchema>;
export type KpiStripPayload = z.infer<typeof KpiStripPayloadSchema>;
