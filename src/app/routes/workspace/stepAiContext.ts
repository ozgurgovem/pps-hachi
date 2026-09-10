import type { TFunction } from "i18next";
import type { A3EntryRendererMap } from "../../../a3/methodContract";
import type { ProjectModel, StepId } from "../../../domain/model";
import { getMethodsForStep } from "../../../methods";
import { getCoachingMarkdown } from "./coachContent";
import { summarizeEntryForAi } from "./entrySummary";

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
 *
 * D-246 (Barış's own real-use report): this prompt used to carry coaching
 * content + the method list and nothing else — the AI genuinely had no way
 * to see the user's own entered data for the step, so its own answers asked
 * the user to paste data it could already have read. Fixed by reusing K2's
 * already-tested `summarizeEntryForAi` (G2 — not a new summarization
 * mechanism) for every entry in this step, the same "one line per entry"
 * shape `buildMockAuditContext`/`buildLayoutReviewContext` already send.
 * `rendererMap` renders with `project.meta.language` (the content/export
 * language, D-43) — never the UI's own `language` parameter below, which
 * only picks which language variant of the *coaching* markdown to send;
 * conflating the two is exactly P-42's own mis-source bug class.
 *
 * Known, accepted gap (P-51, unchanged by this fix): this bare chat
 * (`ai_complete`) never redacts, so an entry's own real content — like the
 * user's own typed question already did before this change — crosses to
 * Vorion unmasked, unlike K1/K2/K3's schema-bound `complete_structured`
 * calls. Confirmed with Barış before building this (chat transcript,
 * 2026-09-10) rather than silently reusing the unredacted path.
 */
export function buildStepAssistantPrompt(
  stepId: StepId,
  language: "tr" | "en",
  t: TFunction,
  question: string,
  project: ProjectModel,
  rendererMap: A3EntryRendererMap,
): string {
  const coaching = getCoachingMarkdown(language, stepId).trim();
  const methodList = getMethodsForStep(stepId)
    .map((plugin) => `- ${t(plugin.nameKey)}: ${t(plugin.useWhenKey)}`)
    .join("\n");
  const entries = project.steps[stepId]?.entries ?? [];
  const entriesText =
    entries.length > 0
      ? entries
          .map((entry) => `- ${summarizeEntryForAi(entry, project.meta.language, rendererMap).summary}`)
          .join("\n")
      : language === "tr"
        ? "(Bu adıma henüz hiçbir girdi eklenmedi.)"
        : "(No entries have been added to this step yet.)";
  const methodsLabel = language === "tr" ? "Bu adımda kullanılabilecek yöntemler" : "Methods available in this step";
  const entriesLabel = language === "tr" ? "Bu adımın kendi girdileri" : "This step's own entries";
  const questionLabel = language === "tr" ? "Kullanıcının sorusu" : "User's question";
  return `${coaching}\n\n${methodsLabel}:\n${methodList}\n\n${entriesLabel}:\n${entriesText}\n\n${questionLabel}: ${question}`;
}
