/**
 * SPEC.md §3.0: replaces §1.3's SQDCM impact tagger with the TPM loss
 * taxonomy the supplied templates already use — the company reports
 * against these categories, not Safety/Quality/Delivery/Cost/Morale.
 *
 * D-267/P-66: eight categories, not seven — `TEMPLATE_ANALYSIS.md` §9.6
 * found the real `PPS_A3_Format_TR.xls` (the form `farplas-7step-tr`
 * claims byte-fidelity to) splits Maintenance into two: Bağımsız Bakım
 * (Autonomous Maintenance) and Profesyonel Bakım (Professional
 * Maintenance). The original seven-category list was
 * `PPS_A3_Format_ENG.xls`'s own list, not the real TR form's. Order
 * matches the TR form's own `U2:AB2` order exactly.
 */
export const TPM_LOSS_CATEGORIES = [
  "workSafety",
  "cost",
  "productivity",
  "quality",
  "autonomousMaintenance",
  "professionalMaintenance",
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
