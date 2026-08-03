import { z } from "zod";

/** One step in a 5-Why chain — shared by `fiveWhy` and `threeLeggedFiveWhy`. */
export const WhyStepSchema = z.looseObject({
  id: z.string(),
  answer: z.string(),
});

export type WhyStep = z.infer<typeof WhyStepSchema>;

export function newWhyStep(): WhyStep {
  return { id: crypto.randomUUID(), answer: "" };
}

/** `entry.title`/`why N: answer` lines — the text shape both methods render into a block. */
export function whyChainLines(steps: readonly WhyStep[]): readonly { readonly text: string }[] {
  return steps
    .filter((step) => step.answer.trim().length > 0)
    .map((step, index) => ({ text: `Why ${index + 1}: ${step.answer}` }));
}
