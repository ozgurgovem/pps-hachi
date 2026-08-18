import { z } from "zod";
import type { A3Language } from "../../a3/methodContract";

/** D-188/P-26: matches `methods.whyChain.whyLabel`'s own editor translation ("Neden {{count}}" / "Why {{count}}"). */
const WHY_LABEL: Readonly<Record<A3Language, string>> = {
  tr: "Neden",
  en: "Why",
};

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
export function whyChainLines(
  steps: readonly WhyStep[],
  language: A3Language,
): readonly { readonly text: string }[] {
  return steps
    .filter((step) => step.answer.trim().length > 0)
    .map((step, index) => ({ text: `${WHY_LABEL[language]} ${index + 1}: ${step.answer}` }));
}
