import { FieldFormEditor } from "../shared/FieldFormEditor";
import type { MethodEditorProps } from "../types";
import { SUSTAIN_PLAN_FIELDS, type SustainPlanFieldKey } from "./fields";
import type { SustainPlanPayload } from "./schema";

export function SustainPlanEditor({ payload, onChange }: MethodEditorProps<SustainPlanPayload>) {
  return (
    <FieldFormEditor<SustainPlanFieldKey>
      idPrefix="sustain-plan"
      fields={SUSTAIN_PLAN_FIELDS}
      values={payload}
      onChange={(values) => onChange({ ...payload, ...values })}
    />
  );
}
