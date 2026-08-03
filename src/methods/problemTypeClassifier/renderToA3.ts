import type { A3BlockContent, A3EntrySummary } from "../../a3/methodContract";
import type { ProblemTypeClassification } from "./classifications";
import type { ProblemTypeClassifierPayload } from "./schema";

const CLASSIFICATION_LABELS: Readonly<Record<ProblemTypeClassification, string>> = {
  belowStandard: "Below standard",
  raiseTheStandard: "Raise the standard",
  inconsistentPerformance: "Inconsistent performance",
};

export function renderProblemTypeClassifierToA3(
  payload: ProblemTypeClassifierPayload,
  entry: A3EntrySummary,
): A3BlockContent {
  const noteLine = payload.note.trim().length > 0 ? [{ text: `Note: ${payload.note}` }] : [];

  return {
    lines: [
      { text: entry.title, bold: true },
      { text: `Classification: ${CLASSIFICATION_LABELS[payload.classification]}` },
      ...noteLine,
    ],
  };
}
