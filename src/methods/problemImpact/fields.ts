import type { FieldFormField } from "../shared/fieldForm";

export type ProblemImpactFieldKey = "monthlyLoss" | "yearlyLoss" | "currencyUnit" | "calculationNote";

/** TEMPLATE_ANALYSIS.md §14.2 item 5: the financial-loss form's four fields. */
export const PROBLEM_IMPACT_FIELDS = [
  {
    key: "monthlyLoss",
    labelKey: "methods.problemImpact.fields.monthlyLoss",
    exportLabel: { tr: "Aylık kayıp", en: "Monthly loss" },
    type: "text",
  },
  {
    key: "yearlyLoss",
    labelKey: "methods.problemImpact.fields.yearlyLoss",
    exportLabel: { tr: "Senelik kayıp", en: "Yearly loss" },
    type: "text",
  },
  {
    key: "currencyUnit",
    labelKey: "methods.problemImpact.fields.currencyUnit",
    exportLabel: { tr: "Birim/para cinsi", en: "Currency/unit" },
    type: "text",
  },
  {
    key: "calculationNote",
    labelKey: "methods.problemImpact.fields.calculationNote",
    exportLabel: { tr: "Hesap notu", en: "Calculation note" },
    type: "textarea",
    wide: true,
  },
] as const satisfies readonly FieldFormField<ProblemImpactFieldKey>[];
