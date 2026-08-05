import { FieldFormEditor } from "../shared/FieldFormEditor";
import type { MethodEditorProps } from "../types";
import { SIDE_EFFECT_RISK_ASSESSMENT_FIELDS, type SideEffectRiskAssessmentFieldKey } from "./fields";
import type { SideEffectRiskAssessmentPayload } from "./schema";

export function SideEffectRiskAssessmentEditor({ payload, onChange }: MethodEditorProps<SideEffectRiskAssessmentPayload>) {
  return (
    <FieldFormEditor<SideEffectRiskAssessmentFieldKey>
      idPrefix="side-effect-risk"
      fields={SIDE_EFFECT_RISK_ASSESSMENT_FIELDS}
      values={payload}
      onChange={(values) => onChange({ ...payload, ...values })}
    />
  );
}
