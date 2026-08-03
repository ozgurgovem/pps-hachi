import { z } from "zod";

/**
 * SPEC.md §1.3 (Step 1): Gap Statement — Ideal / Actual / Gap. Every field is
 * optional text (blank during drafting is normal — D-52 validates at edit
 * time, never load time), loose per D-51.
 */
export const GapStatementPayloadSchema = z.looseObject({
  ideal: z.string(),
  actual: z.string(),
  gap: z.string(),
});

export type GapStatementPayload = z.infer<typeof GapStatementPayloadSchema>;
