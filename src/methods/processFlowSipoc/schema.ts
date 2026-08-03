import { z } from "zod";

/**
 * SPEC.md §1.3 (Step 2): process flow / SIPOC — one row per process step,
 * each with Supplier/Input/Process/Output/Customer. D-115: uses the shared
 * row-table substrate. Loose per D-51.
 */
export const ProcessFlowSipocRowSchema = z.looseObject({
  id: z.string(),
  step: z.string(),
  supplier: z.string(),
  input: z.string(),
  process: z.string(),
  output: z.string(),
  customer: z.string(),
});

export const ProcessFlowSipocPayloadSchema = z.looseObject({
  rows: z.array(ProcessFlowSipocRowSchema),
});

export type ProcessFlowSipocRow = z.infer<typeof ProcessFlowSipocRowSchema>;
export type ProcessFlowSipocPayload = z.infer<typeof ProcessFlowSipocPayloadSchema>;
