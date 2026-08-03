import { z } from "zod";
import { WhyStepSchema } from "../shared/whyChain";

/** SPEC.md §1.3 (Step 4): 5 Why (linear chain). Loose per D-51. */
export const FiveWhyPayloadSchema = z.looseObject({
  problemStatement: z.string(),
  whys: z.array(WhyStepSchema),
});

export type FiveWhyPayload = z.infer<typeof FiveWhyPayloadSchema>;
