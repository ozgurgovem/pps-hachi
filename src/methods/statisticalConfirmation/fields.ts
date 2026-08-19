import type { FieldFormField } from "../shared/fieldForm";

export type StatisticalConfirmationFieldKey = "cp" | "cpk" | "pChartSummary" | "defectRate";

/** SPEC.md §1.3 (Step 7): "Statistical confirmation (capability Cp/Cpk, p-chart, defect rate)." */
export const STATISTICAL_CONFIRMATION_FIELDS = [
  {
    key: "cp",
    labelKey: "methods.statisticalConfirmation.fields.cp",
    exportLabel: { tr: "Cp", en: "Cp" },
    type: "text",
  },
  {
    key: "cpk",
    labelKey: "methods.statisticalConfirmation.fields.cpk",
    exportLabel: { tr: "Cpk", en: "Cpk" },
    type: "text",
  },
  {
    key: "pChartSummary",
    labelKey: "methods.statisticalConfirmation.fields.pChartSummary",
    exportLabel: { tr: "p-kontrol grafiği özeti", en: "p-chart summary" },
    type: "textarea",
    wide: true,
  },
  {
    key: "defectRate",
    labelKey: "methods.statisticalConfirmation.fields.defectRate",
    exportLabel: { tr: "Hata oranı", en: "Defect rate" },
    type: "text",
  },
] as const satisfies readonly FieldFormField<StatisticalConfirmationFieldKey>[];
