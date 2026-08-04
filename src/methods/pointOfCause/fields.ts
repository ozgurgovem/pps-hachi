import type { FieldFormField } from "../shared/fieldForm";

export type PointOfCauseFieldKey =
  | "processStep"
  | "location"
  | "occursWhen"
  | "evidence"
  | "observedAt"
  | "observedBy";

/**
 * SPEC.md §1.3 (Step 2): "**Point of Cause (POC) nomination** — mandatory
 * output of this step", and §1.2 S2 flags a Step 2 with no POC nominated.
 *
 * The point of cause is *where in the process the problem first becomes
 * observable* — not why it happens (that is Step 4). `occursWhen` and
 * `evidence` are what keep it a gemba-confirmed fact rather than an opinion:
 * a nomination with no evidence is the failure mode this step exists to
 * prevent.
 */
export const POINT_OF_CAUSE_FIELDS = [
  { key: "processStep", labelKey: "methods.pointOfCause.fields.processStep", exportLabel: "Process step", type: "text" },
  { key: "location", labelKey: "methods.pointOfCause.fields.location", exportLabel: "Location", type: "text" },
  {
    key: "occursWhen",
    labelKey: "methods.pointOfCause.fields.occursWhen",
    exportLabel: "Occurs when",
    type: "textarea",
    wide: true,
  },
  {
    key: "evidence",
    labelKey: "methods.pointOfCause.fields.evidence",
    exportLabel: "Evidence",
    type: "textarea",
    wide: true,
  },
  { key: "observedAt", labelKey: "methods.pointOfCause.fields.observedAt", exportLabel: "Observed", type: "date" },
  { key: "observedBy", labelKey: "methods.pointOfCause.fields.observedBy", exportLabel: "Observed by", type: "text" },
] as const satisfies readonly FieldFormField<PointOfCauseFieldKey>[];
