import { FieldFormEditor } from "../shared/FieldFormEditor";
import type { MethodEditorProps } from "../types";
import { RESULT_VERDICT_FIELDS, type ResultVerdictFieldKey } from "./fields";
import type { ResultVerdictPayload } from "./schema";

export function ResultVerdictEditor({ payload, onChange }: MethodEditorProps<ResultVerdictPayload>) {
  return (
    <FieldFormEditor<ResultVerdictFieldKey>
      idPrefix="result-verdict"
      fields={RESULT_VERDICT_FIELDS}
      values={payload}
      onChange={(values) => onChange({ ...payload, ...values })}
    />
  );
}
