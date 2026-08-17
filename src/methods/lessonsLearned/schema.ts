import { z } from "zod";

/**
 * TEMPLATE_ANALYSIS.md §13.1: an 8-question structured Lessons Learned
 * checklist. D-127's `fieldForm` substrate — one record, fixed fields. Loose
 * per D-51.
 */
export const LessonsLearnedPayloadSchema = z.looseObject({
  wentWell: z.string(),
  failedOrDelayed: z.string(),
  evidenceChangedThinking: z.string(),
  shouldBeReused: z.string(),
  shouldBeAvoided: z.string(),
  coachingCapabilityLesson: z.string(),
  customerCommunicationLesson: z.string(),
  finalClosureRationale: z.string(),
});

export type LessonsLearnedPayload = z.infer<typeof LessonsLearnedPayloadSchema>;
