import { FieldFormEditor } from "../shared/FieldFormEditor";
import type { MethodEditorProps } from "../types";
import { STATISTICAL_CONFIRMATION_FIELDS, type StatisticalConfirmationFieldKey } from "./fields";
import type { StatisticalConfirmationPayload } from "./schema";

export function StatisticalConfirmationEditor({ payload, onChange }: MethodEditorProps<StatisticalConfirmationPayload>) {
  return (
    <FieldFormEditor<StatisticalConfirmationFieldKey>
      idPrefix="statistical-confirmation"
      fields={STATISTICAL_CONFIRMATION_FIELDS}
      values={payload}
      onChange={(values) => onChange({ ...payload, ...values })}
    />
  );
}
