import type { A3BlockContent, A3EntrySummary, A3Language } from "../../a3/methodContract";
import { resolveA3Language } from "../../a3/methodContract";
import type { ProblemTypeClassification } from "./classifications";
import type { ProblemTypeClassifierPayload } from "./schema";

/** D-188/P-26: matches `methods.problemTypeClassifier.classifications.*`'s own editor translations. */
const CLASSIFICATION_LABELS: Readonly<Record<ProblemTypeClassification, Readonly<Record<A3Language, string>>>> = {
  belowStandard: { tr: "Standardın altında", en: "Below standard" },
  raiseTheStandard: { tr: "Standardı yükselt", en: "Raise the standard" },
  inconsistentPerformance: { tr: "Tutarsız performans", en: "Inconsistent performance" },
};

/** D-188/P-26: matches `methods.problemTypeClassifier.{classificationLabel,noteLabel}`'s own editor translations. */
const CLASSIFICATION_PREFIX: Readonly<Record<A3Language, string>> = { tr: "Sınıflandırma", en: "Classification" };
const NOTE_LABEL: Readonly<Record<A3Language, string>> = { tr: "Not", en: "Note" };

export function renderProblemTypeClassifierToA3(
  payload: ProblemTypeClassifierPayload,
  entry: A3EntrySummary,
): A3BlockContent {
  const language = resolveA3Language(entry);
  const noteLine = payload.note.trim().length > 0 ? [{ text: `${NOTE_LABEL[language]}: ${payload.note}` }] : [];

  return {
    lines: [
      { text: entry.title, bold: true },
      { text: `${CLASSIFICATION_PREFIX[language]}: ${CLASSIFICATION_LABELS[payload.classification][language]}` },
      ...noteLine,
    ],
  };
}
