/**
 * SPEC.md §3.0: replaces §1.3's SQDCM impact tagger with the TPM loss
 * taxonomy the supplied templates already use — the company reports
 * against these seven categories, not Safety/Quality/Delivery/Cost/Morale.
 */
export const TPM_LOSS_CATEGORIES = [
  "workSafety",
  "cost",
  "productivity",
  "quality",
  "maintenance",
  "humanResources",
  "environment",
] as const;

export type TpmLossCategory = (typeof TPM_LOSS_CATEGORIES)[number];

export const TPM_LOSS_SEVERITIES = ["low", "medium", "high"] as const;
export type TpmLossSeverity = (typeof TPM_LOSS_SEVERITIES)[number];

/** i18next key for a category's display label. */
export function tpmLossCategoryLabelKey(category: TpmLossCategory): string {
  return `methods.tpmLossTaxonomy.categories.${category}`;
}

/** i18next key for a severity's display label. */
export function tpmLossSeverityLabelKey(severity: TpmLossSeverity): string {
  return `methods.tpmLossTaxonomy.severities.${severity}`;
}
