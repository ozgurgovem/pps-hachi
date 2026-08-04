import { FieldFormEditor } from "../shared/FieldFormEditor";
import type { MethodEditorProps } from "../types";
import { COUNTERMEASURE_FIELDS, type CountermeasureFieldKey } from "./fields";
import type { CountermeasurePayload } from "./schema";

export function CountermeasureEditor({ payload, onChange }: MethodEditorProps<CountermeasurePayload>) {
  return (
    <FieldFormEditor<CountermeasureFieldKey>
      idPrefix="countermeasure"
      fields={COUNTERMEASURE_FIELDS}
      values={payload}
      onChange={(values) => onChange({ ...payload, ...values })}
    />
  );
}
