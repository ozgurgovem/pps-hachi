import type { MethodPlugin } from "../types";
import { TrainingCommunicationRecordEditor } from "./Editor";
import { renderTrainingCommunicationRecordToA3 } from "./renderToA3";
import { TrainingCommunicationRecordPayloadSchema, type TrainingCommunicationRecordPayload } from "./schema";

export const TRAINING_COMMUNICATION_RECORD_METHOD_ID = "training-communication-record";

export const trainingCommunicationRecordMethod: MethodPlugin<TrainingCommunicationRecordPayload> = {
  id: TRAINING_COMMUNICATION_RECORD_METHOD_ID,
  steps: [6],
  nameKey: "methods.trainingCommunicationRecord.name",
  useWhenKey: "methods.trainingCommunicationRecord.useWhen",
  schema: TrainingCommunicationRecordPayloadSchema,
  Editor: TrainingCommunicationRecordEditor,
  createEmptyPayload: () => ({ rows: [] }),
  renderToA3: renderTrainingCommunicationRecordToA3,
};
