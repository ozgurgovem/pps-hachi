import type { FieldFormField } from "../shared/fieldForm";

export type SustainPlanFieldKey = "auditType" | "frequency" | "owner" | "lpaLinkage";

/**
 * SPEC.md §1.3 (Step 8): "Sustain plan (audit type, frequency, owner, LPA
 * linkage)." Distinct from `sustainmentAudit` (Step 7, D-183) — this is the
 * forward-looking plan for *future* audits (which type, how often, who
 * owns it), `sustainmentAudit` is the log of audits already performed.
 */
export const SUSTAIN_PLAN_FIELDS = [
  {
    key: "auditType",
    labelKey: "methods.sustainPlan.fields.auditType",
    exportLabel: { tr: "Denetim tipi", en: "Audit type" },
    type: "text",
  },
  {
    key: "frequency",
    labelKey: "methods.sustainPlan.fields.frequency",
    exportLabel: { tr: "Sıklık", en: "Frequency" },
    type: "text",
  },
  {
    key: "owner",
    labelKey: "methods.sustainPlan.fields.owner",
    exportLabel: { tr: "Sahip", en: "Owner" },
    type: "text",
  },
  {
    key: "lpaLinkage",
    labelKey: "methods.sustainPlan.fields.lpaLinkage",
    exportLabel: { tr: "LPA bağlantısı", en: "LPA linkage" },
    type: "text",
  },
] as const satisfies readonly FieldFormField<SustainPlanFieldKey>[];
