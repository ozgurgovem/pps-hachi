import type { FieldFormField } from "../shared/fieldForm";

export type SideEffectRiskAssessmentFieldKey = "description" | "severity" | "mitigation";

export const SIDE_EFFECT_SEVERITY_OPTIONS = [
  { value: "low", labelKey: "methods.sideEffectRiskAssessment.severities.low" },
  { value: "medium", labelKey: "methods.sideEffectRiskAssessment.severities.medium" },
  { value: "high", labelKey: "methods.sideEffectRiskAssessment.severities.high" },
] as const;

/** A3-side labels — `renderToA3` is i18n-free (D-43). */
export const SIDE_EFFECT_SEVERITY_EXPORT_LABELS: Readonly<Record<string, string>> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

/** SPEC.md §1.3 (Step 5): "Side-effect / risk assessment of the countermeasure itself." */
export const SIDE_EFFECT_RISK_ASSESSMENT_FIELDS = [
  {
    key: "description",
    labelKey: "methods.sideEffectRiskAssessment.fields.description",
    exportLabel: "Side effect / risk",
    type: "textarea",
    wide: true,
  },
  {
    key: "severity",
    labelKey: "methods.sideEffectRiskAssessment.fields.severity",
    exportLabel: "Severity",
    type: "select",
    options: SIDE_EFFECT_SEVERITY_OPTIONS,
  },
  {
    key: "mitigation",
    labelKey: "methods.sideEffectRiskAssessment.fields.mitigation",
    exportLabel: "Mitigation",
    type: "textarea",
    wide: true,
  },
] as const satisfies readonly FieldFormField<SideEffectRiskAssessmentFieldKey>[];
