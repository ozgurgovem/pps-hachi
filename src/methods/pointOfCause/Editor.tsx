import { FieldFormEditor } from "../shared/FieldFormEditor";
import type { MethodEditorProps } from "../types";
import { POINT_OF_CAUSE_FIELDS, type PointOfCauseFieldKey } from "./fields";
import type { PointOfCausePayload } from "./schema";

export function PointOfCauseEditor({ payload, onChange }: MethodEditorProps<PointOfCausePayload>) {
  return (
    <FieldFormEditor<PointOfCauseFieldKey>
      idPrefix="point-of-cause"
      fields={POINT_OF_CAUSE_FIELDS}
      values={payload}
      onChange={(values) => onChange({ ...payload, ...values })}
    />
  );
}
