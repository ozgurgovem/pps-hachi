import { REFERENCE_ROLES } from "../../domain/model";
import { emptyFieldFormValues } from "../shared/fieldForm";
import type { MethodPlugin } from "../types";
import { SideEffectRiskAssessmentEditor } from "./Editor";
import { SIDE_EFFECT_RISK_ASSESSMENT_FIELDS } from "./fields";
import { renderSideEffectRiskAssessmentToA3 } from "./renderToA3";
import { SideEffectRiskAssessmentPayloadSchema, type SideEffectRiskAssessmentPayload } from "./schema";

export const SIDE_EFFECT_RISK_ASSESSMENT_METHOD_ID = "side-effect-risk-assessment";

export const sideEffectRiskAssessmentMethod: MethodPlugin<SideEffectRiskAssessmentPayload> = {
  id: SIDE_EFFECT_RISK_ASSESSMENT_METHOD_ID,
  steps: [5],
  nameKey: "methods.sideEffectRiskAssessment.name",
  useWhenKey: "methods.sideEffectRiskAssessment.useWhen",
  schema: SideEffectRiskAssessmentPayloadSchema,
  Editor: SideEffectRiskAssessmentEditor,
  createEmptyPayload: () => emptyFieldFormValues(SIDE_EFFECT_RISK_ASSESSMENT_FIELDS),
  renderToA3: renderSideEffectRiskAssessmentToA3,
  /**
   * Barış's call (2026-08-05): reuse the existing `countermeasure` role
   * rather than leaving this method reference-free, since it rates a
   * *specific* countermeasure. Second same-step reference in the registry,
   * after `error-proofing-hierarchy` — see that method's comment.
   */
  referenceRoles: [
    {
      role: REFERENCE_ROLES.countermeasure,
      labelKey: "methods.sideEffectRiskAssessment.references.countermeasure.label",
      emptyKey: "methods.sideEffectRiskAssessment.references.countermeasure.empty",
      fromSteps: [5],
      multiple: false,
    },
  ],
};
