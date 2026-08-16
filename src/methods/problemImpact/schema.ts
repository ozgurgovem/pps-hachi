import { z } from "zod";

/**
 * TEMPLATE_ANALYSIS.md §14.2 item 5 / DECISIONS.md D-166: ADIM 1's optional
 * cost-impact panel — its own Pareto data (the same shape `pareto/schema.ts`
 * uses, so `renderToA3` can build an identical `ParetoChartSpec`) plus a
 * fixed-field financial-loss form. Per D-124: this is a Step 1 entry with
 * its own independent Pareto data, never a display of Step 2's `pareto`
 * entry. Loose per D-51.
 */
export const ProblemImpactCategorySchema = z.looseObject({
  id: z.string(),
  label: z.string(),
  count: z.number(),
});

export const ProblemImpactPayloadSchema = z.looseObject({
  unit: z.string(),
  categories: z.array(ProblemImpactCategorySchema),
  monthlyLoss: z.string(),
  yearlyLoss: z.string(),
  currencyUnit: z.string(),
  calculationNote: z.string(),
});

export type ProblemImpactCategory = z.infer<typeof ProblemImpactCategorySchema>;
export type ProblemImpactPayload = z.infer<typeof ProblemImpactPayloadSchema>;
