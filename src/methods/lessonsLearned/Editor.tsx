import { FieldFormEditor } from "../shared/FieldFormEditor";
import type { MethodEditorProps } from "../types";
import { LESSONS_LEARNED_FIELDS, type LessonsLearnedFieldKey } from "./fields";
import type { LessonsLearnedPayload } from "./schema";

export function LessonsLearnedEditor({ payload, onChange }: MethodEditorProps<LessonsLearnedPayload>) {
  return (
    <FieldFormEditor<LessonsLearnedFieldKey>
      idPrefix="lessons-learned"
      fields={LESSONS_LEARNED_FIELDS}
      values={payload}
      onChange={(values) => onChange({ ...payload, ...values })}
    />
  );
}
