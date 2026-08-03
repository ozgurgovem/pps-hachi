import { z } from "zod";

/**
 * SPEC.md §1.3 (Step 1): 5W2H (What, Where, When, Who, Which, How, How
 * much). Every field is optional text, loose per D-51.
 */
export const FiveW2HPayloadSchema = z.looseObject({
  what: z.string(),
  where: z.string(),
  when: z.string(),
  who: z.string(),
  which: z.string(),
  how: z.string(),
  howMuch: z.string(),
});

export type FiveW2HPayload = z.infer<typeof FiveW2HPayloadSchema>;
