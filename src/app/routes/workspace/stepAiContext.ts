import type { TFunction } from "i18next";
import type { StepId } from "../../../domain/model";
import { getMethodsForStep } from "../../../methods";
import { getCoachingMarkdown } from "./coachContent";

/**
 * P-59/D-218 §2.2: the step-scoped Assistant enriches every outgoing prompt
 * with this step's own context, decided directly (Anayasa Madde 9) rather
 * than asked — two real options existed (a new whole-project-style prompt
 * file under `src/ai/prompts/whole-project/`, matching K1-K3's addressing,
 * or a client-side prefix inside the component that sends the request) and
 * the K1-K3 prompt library is keyed by `{step, methodId}`/`{purpose}`, built
 * for schema-bound `complete_structured` calls — this bare chat
 * (`completeStreaming`, D-201) has no schema and no method, so a client-side
 * prefix is the smaller, more honest mechanism.
 *
 * Deliberately does NOT introspect a plugin's Zod schema at runtime (D-218's
 * "yöntem şeması" wording) — reading `_def.shape` off an arbitrary
 * `ZodType<unknown>` is fragile across zod versions and payload shapes
 * (`looseObject`, nested row tables, …). A method's own localized
 * `nameKey`/`useWhenKey` already says what it is and when to use it, and is
 * exactly what `MethodBand`'s own cards show — reusing it here is more
 * robust than a bespoke schema walk, at the cost of not naming individual
 * fields.
 */
export function buildStepAssistantPrompt(
  stepId: StepId,
  language: "tr" | "en",
  t: TFunction,
  question: string,
): string {
  const coaching = getCoachingMarkdown(language, stepId).trim();
  const methodList = getMethodsForStep(stepId)
    .map((plugin) => `- ${t(plugin.nameKey)}: ${t(plugin.useWhenKey)}`)
    .join("\n");
  const methodsLabel = language === "tr" ? "Bu adımda kullanılabilecek yöntemler" : "Methods available in this step";
  const questionLabel = language === "tr" ? "Kullanıcının sorusu" : "User's question";
  return `${coaching}\n\n${methodsLabel}:\n${methodList}\n\n${questionLabel}: ${question}`;
}
