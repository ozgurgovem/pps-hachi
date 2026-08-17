import type { FieldFormField } from "../shared/fieldForm";

export type LessonsLearnedFieldKey =
  | "wentWell"
  | "failedOrDelayed"
  | "evidenceChangedThinking"
  | "shouldBeReused"
  | "shouldBeAvoided"
  | "coachingCapabilityLesson"
  | "customerCommunicationLesson"
  | "finalClosureRationale";

/**
 * TEMPLATE_ANALYSIS.md §13.1 (Standardization, Yokoten & Lessons Learned
 * page) / §13.4 candidate 4: eight fixed questions, each a long free-text
 * answer — `shared/fieldForm.ts`'s substrate (D-127), one record, fixed
 * fields, all `textarea`/`wide` since every answer is narrative rather than
 * a short label-value pair.
 */
export const LESSONS_LEARNED_FIELDS = [
  {
    key: "wentWell",
    labelKey: "methods.lessonsLearned.fields.wentWell",
    exportLabel: "What went well?",
    type: "textarea",
    wide: true,
  },
  {
    key: "failedOrDelayed",
    labelKey: "methods.lessonsLearned.fields.failedOrDelayed",
    exportLabel: "What failed or was delayed?",
    type: "textarea",
    wide: true,
  },
  {
    key: "evidenceChangedThinking",
    labelKey: "methods.lessonsLearned.fields.evidenceChangedThinking",
    exportLabel: "What evidence changed our thinking?",
    type: "textarea",
    wide: true,
  },
  {
    key: "shouldBeReused",
    labelKey: "methods.lessonsLearned.fields.shouldBeReused",
    exportLabel: "What should be reused?",
    type: "textarea",
    wide: true,
  },
  {
    key: "shouldBeAvoided",
    labelKey: "methods.lessonsLearned.fields.shouldBeAvoided",
    exportLabel: "What should be avoided?",
    type: "textarea",
    wide: true,
  },
  {
    key: "coachingCapabilityLesson",
    labelKey: "methods.lessonsLearned.fields.coachingCapabilityLesson",
    exportLabel: "Coaching-capability lesson",
    type: "textarea",
    wide: true,
  },
  {
    key: "customerCommunicationLesson",
    labelKey: "methods.lessonsLearned.fields.customerCommunicationLesson",
    exportLabel: "Customer communication lesson",
    type: "textarea",
    wide: true,
  },
  {
    key: "finalClosureRationale",
    labelKey: "methods.lessonsLearned.fields.finalClosureRationale",
    exportLabel: "Final closure rationale",
    type: "textarea",
    wide: true,
  },
] as const satisfies readonly FieldFormField<LessonsLearnedFieldKey>[];
