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
  {
    key: "documentNo",
    labelKey: "methods.pfmeaLinkage.fields.documentNo",
    exportLabel: { tr: "PFMEA no", en: "PFMEA no" },
    type: "text",
  },
  {
    key: "revision",
    labelKey: "methods.pfmeaLinkage.fields.revision",
    exportLabel: { tr: "Rev", en: "Rev" },
    type: "text",
  },
  {
    key: "processStep",
    labelKey: "methods.pfmeaLinkage.fields.processStep",
    exportLabel: { tr: "Proses adımı", en: "Process step" },
    type: "text",
  },
  {
    key: "failureMode",
    labelKey: "methods.pfmeaLinkage.fields.failureMode",
    exportLabel: { tr: "Hata türü", en: "Failure mode" },
    type: "textarea",
    wide: true,
  },
  {
    key: "effect",
    labelKey: "methods.pfmeaLinkage.fields.effect",
    exportLabel: { tr: "Etki", en: "Effect" },
    type: "textarea",
    wide: true,
  },
  {
    key: "severity",
    labelKey: "methods.pfmeaLinkage.fields.severity",
    exportLabel: { tr: "S", en: "S" },
    type: "text",
  },
  {
    key: "occurrence",
    labelKey: "methods.pfmeaLinkage.fields.occurrence",
    exportLabel: { tr: "O", en: "O" },
    type: "text",
  },
  {
    key: "detection",
    labelKey: "methods.pfmeaLinkage.fields.detection",
    exportLabel: { tr: "D", en: "D" },
    type: "text",
  },
  {
    key: "currentControls",
    labelKey: "methods.pfmeaLinkage.fields.currentControls",
    exportLabel: { tr: "Mevcut kontroller", en: "Current controls" },
    type: "textarea",
    wide: true,
  },
  {
    key: "note",
    labelKey: "methods.pfmeaLinkage.fields.note",
    exportLabel: { tr: "Not", en: "Note" },
    type: "textarea",
    wide: true,
  },
] as const satisfies readonly FieldFormField<PfmeaLinkageFieldKey>[];
