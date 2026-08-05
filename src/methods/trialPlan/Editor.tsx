import { FieldFormEditor } from "../shared/FieldFormEditor";
import type { MethodEditorProps } from "../types";
import { TRIAL_PLAN_FIELDS, type TrialPlanFieldKey } from "./fields";
import type { TrialPlanPayload } from "./schema";

export function TrialPlanEditor({ payload, onChange }: MethodEditorProps<TrialPlanPayload>) {
  return (
    <FieldFormEditor<TrialPlanFieldKey>
      idPrefix="trial-plan"
      fields={TRIAL_PLAN_FIELDS}
      values={payload}
      onChange={(values) => onChange({ ...payload, ...values })}
    />
  );
}
