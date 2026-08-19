import { z } from "zod";

/** SPEC.md §1.3 (Step 7): "Statistical confirmation (capability Cp/Cpk, p-chart, defect rate)." Loose per D-51. */
export const StatisticalConfirmationPayloadSchema = z.looseObject({
  cp: z.string(),
  cpk: z.string(),
  pChartSummary: z.string(),
  defectRate: z.string(),
});

export type StatisticalConfirmationPayload = z.infer<typeof StatisticalConfirmationPayloadSchema>;
