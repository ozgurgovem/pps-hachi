import type { FieldFormField } from "../shared/fieldForm";

export type RealizedCostBenefitFieldKey = "realizedBenefit" | "actualCost" | "netBenefit" | "notes";

/** SPEC.md §1.3 (Step 7): "Realized cost-benefit." */
export const REALIZED_COST_BENEFIT_FIELDS = [
  {
    key: "realizedBenefit",
    labelKey: "methods.realizedCostBenefit.fields.realizedBenefit",
    exportLabel: { tr: "Gerçekleşen fayda", en: "Realized benefit" },
    type: "text",
  },
  {
    key: "actualCost",
    labelKey: "methods.realizedCostBenefit.fields.actualCost",
    exportLabel: { tr: "Gerçekleşen maliyet", en: "Actual cost" },
    type: "text",
  },
  {
    key: "netBenefit",
    labelKey: "methods.realizedCostBenefit.fields.netBenefit",
    exportLabel: { tr: "Net fayda", en: "Net benefit" },
    type: "text",
  },
  {
    key: "notes",
    labelKey: "methods.realizedCostBenefit.fields.notes",
    exportLabel: { tr: "Notlar", en: "Notes" },
    type: "textarea",
    wide: true,
  },
] as const satisfies readonly FieldFormField<RealizedCostBenefitFieldKey>[];
