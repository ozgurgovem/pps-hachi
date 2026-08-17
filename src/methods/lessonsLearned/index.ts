import { emptyFieldFormValues } from "../shared/fieldForm";
import type { MethodPlugin } from "../types";
import { LessonsLearnedEditor } from "./Editor";
import { LESSONS_LEARNED_FIELDS } from "./fields";
import { renderLessonsLearnedToA3 } from "./renderToA3";
import { LessonsLearnedPayloadSchema, type LessonsLearnedPayload } from "./schema";

export const LESSONS_LEARNED_METHOD_ID = "lessons-learned";

export const lessonsLearnedMethod: MethodPlugin<LessonsLearnedPayload> = {
  id: LESSONS_LEARNED_METHOD_ID,
  steps: [8],
  nameKey: "methods.lessonsLearned.name",
  useWhenKey: "methods.lessonsLearned.useWhen",
  schema: LessonsLearnedPayloadSchema,
  Editor: LessonsLearnedEditor,
  createEmptyPayload: () => emptyFieldFormValues(LESSONS_LEARNED_FIELDS),
  renderToA3: renderLessonsLearnedToA3,
};
