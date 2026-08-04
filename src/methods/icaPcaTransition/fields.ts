import type { FieldFormField } from "../shared/fieldForm";

export type IcaPcaTransitionFieldKey =
  | "exitCriteria"
  | "verificationEvidence"
  | "plannedRemovalDate"
  | "actualRemovalDate"
  | "owner"
  | "status";

export const ICA_PCA_STATUS_OPTIONS = [
  { value: "icaActive", labelKey: "methods.icaPcaTransition.statuses.icaActive" },
  { value: "pcaInPlace", labelKey: "methods.icaPcaTransition.statuses.pcaInPlace" },
  { value: "icaRemoved", labelKey: "methods.icaPcaTransition.statuses.icaRemoved" },
] as const;

/** A3-side labels — `renderToA3` is i18n-free (D-43). */
export const ICA_PCA_STATUS_EXPORT_LABELS: Readonly<Record<string, string>> = {
  icaActive: "ICA active",
  pcaInPlace: "PCA in place",
  icaRemoved: "ICA removed",
};

/**
 * SPEC.md §1.3 (Step 6): "ICA → PCA transition tracker (when does the interim
 * action get removed?)".
 *
 * The two things being linked — the interim containment action and the
 * permanent countermeasure — are entries elsewhere in the project, so they
 * are `references[]` (D-116), not fields here. What is left is the transition
 * itself: what has to be true before the interim action comes off, and
 * whether it actually did.
 */
export const ICA_PCA_TRANSITION_FIELDS = [
  {
    key: "exitCriteria",
    labelKey: "methods.icaPcaTransition.fields.exitCriteria",
    exportLabel: "Exit criteria",
    type: "textarea",
    wide: true,
  },
  {
    key: "verificationEvidence",
    labelKey: "methods.icaPcaTransition.fields.verificationEvidence",
    exportLabel: "Verification",
    type: "textarea",
    wide: true,
  },
  {
    key: "plannedRemovalDate",
    labelKey: "methods.icaPcaTransition.fields.plannedRemovalDate",
    exportLabel: "Planned removal",
    type: "date",
  },
  {
    key: "actualRemovalDate",
    labelKey: "methods.icaPcaTransition.fields.actualRemovalDate",
    exportLabel: "Actual removal",
    type: "date",
  },
  { key: "owner", labelKey: "methods.icaPcaTransition.fields.owner", exportLabel: "Owner", type: "text" },
  {
    key: "status",
    labelKey: "methods.icaPcaTransition.fields.status",
    exportLabel: "Status",
    type: "select",
    options: ICA_PCA_STATUS_OPTIONS,
  },
] as const satisfies readonly FieldFormField<IcaPcaTransitionFieldKey>[];
