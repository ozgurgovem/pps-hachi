/** SPEC.md §1.3 (Step 1): the three problem-type classifications. */
export const PROBLEM_TYPE_CLASSIFICATIONS = [
  "belowStandard",
  "raiseTheStandard",
  "inconsistentPerformance",
] as const;

export type ProblemTypeClassification = (typeof PROBLEM_TYPE_CLASSIFICATIONS)[number];

/** i18next key for a classification's display label. */
export function classificationLabelKey(classification: ProblemTypeClassification): string {
  return `methods.problemTypeClassifier.classifications.${classification}`;
}
