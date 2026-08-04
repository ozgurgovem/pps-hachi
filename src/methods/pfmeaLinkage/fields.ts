import type { FieldFormField } from "../shared/fieldForm";

export type PfmeaLinkageFieldKey =
  | "documentNo"
  | "revision"
  | "processStep"
  | "failureMode"
  | "effect"
  | "severity"
  | "occurrence"
  | "detection"
  | "currentControls"
  | "note";

/** One list drives the editor's field order and the A3 line order — they can never disagree. */
export const PFMEA_LINKAGE_FIELDS = [
  { key: "documentNo", labelKey: "methods.pfmeaLinkage.fields.documentNo", exportLabel: "PFMEA no", type: "text" },
  { key: "revision", labelKey: "methods.pfmeaLinkage.fields.revision", exportLabel: "Rev", type: "text" },
  { key: "processStep", labelKey: "methods.pfmeaLinkage.fields.processStep", exportLabel: "Process step", type: "text" },
  {
    key: "failureMode",
    labelKey: "methods.pfmeaLinkage.fields.failureMode",
    exportLabel: "Failure mode",
    type: "textarea",
    wide: true,
  },
  { key: "effect", labelKey: "methods.pfmeaLinkage.fields.effect", exportLabel: "Effect", type: "textarea", wide: true },
  { key: "severity", labelKey: "methods.pfmeaLinkage.fields.severity", exportLabel: "S", type: "text" },
  { key: "occurrence", labelKey: "methods.pfmeaLinkage.fields.occurrence", exportLabel: "O", type: "text" },
  { key: "detection", labelKey: "methods.pfmeaLinkage.fields.detection", exportLabel: "D", type: "text" },
  {
    key: "currentControls",
    labelKey: "methods.pfmeaLinkage.fields.currentControls",
    exportLabel: "Current controls",
    type: "textarea",
    wide: true,
  },
  { key: "note", labelKey: "methods.pfmeaLinkage.fields.note", exportLabel: "Note", type: "textarea", wide: true },
] as const satisfies readonly FieldFormField<PfmeaLinkageFieldKey>[];
