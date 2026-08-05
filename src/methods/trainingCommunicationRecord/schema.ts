import { z } from "zod";

/** SPEC.md §1.3 (Step 6): training & communication record — one row per event. D-115. Loose per D-51. */
export const TrainingCommunicationRecordRowSchema = z.looseObject({
  id: z.string(),
  date: z.string(),
  audience: z.string(),
  method: z.string(),
  acknowledgedBy: z.string(),
});

export const TrainingCommunicationRecordPayloadSchema = z.looseObject({
  rows: z.array(TrainingCommunicationRecordRowSchema),
});

export type TrainingCommunicationRecordRow = z.infer<typeof TrainingCommunicationRecordRowSchema>;
export type TrainingCommunicationRecordPayload = z.infer<typeof TrainingCommunicationRecordPayloadSchema>;
