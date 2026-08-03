import { z } from "zod";
import { WhyStepSchema } from "../shared/whyChain";

/**
 * SPEC.md §1.3 (Step 4): 3-Legged 5 Why (Occurrence / Detection / Systemic-
 * Management) — the automotive default for customer complaints, per SPEC.md
 * §1.3's own framing. Three parallel chains, not a new graph type. Loose
 * per D-51.
 */
export const ThreeLeggedFiveWhyPayloadSchema = z.looseObject({
  problemStatement: z.string(),
  occurrence: z.array(WhyStepSchema),
  detection: z.array(WhyStepSchema),
  systemic: z.array(WhyStepSchema),
});

export type ThreeLeggedFiveWhyPayload = z.infer<typeof ThreeLeggedFiveWhyPayloadSchema>;
