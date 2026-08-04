import { z } from "zod";

/**
 * SPEC.md §1.3 (Step 4): comparative analysis — good part vs bad part, good
 * line vs bad line. D-115's row-table substrate; `subject` names what the two
 * columns are (parts, lines, shifts) so the export reads without the editor.
 * Loose per D-51, every field a string per D-120.
 */
export const ComparativeAnalysisRowSchema = z.looseObject({
  id: z.string(),
  characteristic: z.string(),
  goodCase: z.string(),
  badCase: z.string(),
  difference: z.string(),
});

export const ComparativeAnalysisPayloadSchema = z.looseObject({
  subject: z.string(),
  rows: z.array(ComparativeAnalysisRowSchema),
});

export type ComparativeAnalysisRow = z.infer<typeof ComparativeAnalysisRowSchema>;
export type ComparativeAnalysisPayload = z.infer<typeof ComparativeAnalysisPayloadSchema>;
