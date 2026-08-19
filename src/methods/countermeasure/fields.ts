import type { A3Language } from "../../a3/methodContract";
import type { FieldFormField } from "../shared/fieldForm";
import type { StatusTone } from "../shared/statusGlyph";

export type CountermeasureFieldKey =
  | "description"
  | "expectedEffect"
  | "owner"
  | "targetDate"
  | "status"
  | "impactScore"
  | "costScore"
  | "durationScore"
  | "priorityDecision";

export const COUNTERMEASURE_STATUS_OPTIONS = [
  { value: "proposed", labelKey: "methods.countermeasure.statuses.proposed" },
  { value: "approved", labelKey: "methods.countermeasure.statuses.approved" },
  { value: "rejected", labelKey: "methods.countermeasure.statuses.rejected" },
] as const;

/** A3-side labels, keyed by `A3Language` (D-188/P-26) — `renderToA3` is i18n-free (D-43). */
export const COUNTERMEASURE_STATUS_EXPORT_LABELS: Readonly<Record<string, Readonly<Record<A3Language, string>>>> = {
  proposed: { tr: "Önerildi", en: "Proposed" },
  approved: { tr: "Onaylandı", en: "Approved" },
  rejected: { tr: "Reddedildi", en: "Rejected" },
};

/** P-37: D-41's shape-coded status marker, applied to the entry's title line — the entry carries the status, not each field. */
export const COUNTERMEASURE_STATUS_TONE: Readonly<Record<string, StatusTone>> = {
  approved: "positive",
  proposed: "caution",
  rejected: "negative",
};

/**
 * Barış's "Uygulama Planı" table (2026-08-18): a separate decision from
 * `status` above — whether to schedule this countermeasure *now*, given its
 * computed priority score (`priorityScoreOf`). "pending" first so a fresh
 * countermeasure defaults to it (`emptyFieldFormValues` picks each select's
 * first option).
 */
export const COUNTERMEASURE_PRIORITY_DECISION_OPTIONS = [
  { value: "pending", labelKey: "methods.countermeasure.priorityDecisions.pending" },
  { value: "pursue", labelKey: "methods.countermeasure.priorityDecisions.pursue" },
  { value: "abandon", labelKey: "methods.countermeasure.priorityDecisions.abandon" },
] as const;

export const COUNTERMEASURE_PRIORITY_DECISION_EXPORT_LABELS: Readonly<
  Record<string, Readonly<Record<A3Language, string>>>
> = {
  pending: { tr: "Beklemede", en: "Pending" },
  pursue: { tr: "Uygulanacak", en: "Pursue" },
  abandon: { tr: "Vazgeçildi", en: "Abandoned" },
};

/** Applied to the computed priority-score line (`renderCountermeasureToA3`), not the title — `status`'s glyph already owns the title. */
export const COUNTERMEASURE_PRIORITY_DECISION_TONE: Readonly<Record<string, StatusTone>> = {
  pursue: "positive",
  pending: "caution",
  abandon: "negative",
};

/**
 * SPEC.md §1.3 (Step 5): "Countermeasure list, each linked to one or more
 * verified root causes."
 *
 * Deliberately narrow. §1.3 lists the error-proofing hierarchy selector, the
 * impact/effort matrix, the Pugh matrix, the side-effect assessment, the
 * trial plan and the cost/approval fields as **separate methods**, which
 * D-114 places in slice 6c. Absorbing any of them here would quietly move
 * 6c's scope into 6b and leave two editors competing to own the same field.
 */
export const COUNTERMEASURE_FIELDS = [
  {
    key: "description",
    labelKey: "methods.countermeasure.fields.description",
    exportLabel: { tr: "Karşı önlem", en: "Countermeasure" },
    type: "textarea",
    wide: true,
  },
  {
    key: "expectedEffect",
    labelKey: "methods.countermeasure.fields.expectedEffect",
    exportLabel: { tr: "Beklenen etki", en: "Expected effect" },
    type: "textarea",
    wide: true,
  },
  {
    key: "owner",
    labelKey: "methods.countermeasure.fields.owner",
    exportLabel: { tr: "Sorumlu", en: "Owner" },
    type: "text",
  },
  {
    key: "targetDate",
    labelKey: "methods.countermeasure.fields.targetDate",
    exportLabel: { tr: "Hedef tarih", en: "Target" },
    type: "date",
  },
  {
    key: "status",
    labelKey: "methods.countermeasure.fields.status",
    exportLabel: { tr: "Durum", en: "Status" },
    type: "select",
    options: COUNTERMEASURE_STATUS_OPTIONS,
  },
  {
    key: "impactScore",
    labelKey: "methods.countermeasure.fields.impactScore",
    exportLabel: { tr: "Etki", en: "Impact" },
    type: "text",
  },
  {
    key: "costScore",
    labelKey: "methods.countermeasure.fields.costScore",
    exportLabel: { tr: "Maliyet puanı", en: "Cost score" },
    type: "text",
  },
  {
    key: "durationScore",
    labelKey: "methods.countermeasure.fields.durationScore",
    exportLabel: { tr: "Süre puanı", en: "Duration score" },
    type: "text",
  },
  {
    key: "priorityDecision",
    labelKey: "methods.countermeasure.fields.priorityDecision",
    exportLabel: { tr: "Öncelik kararı", en: "Priority decision" },
    type: "select",
    options: COUNTERMEASURE_PRIORITY_DECISION_OPTIONS,
  },
] as const satisfies readonly FieldFormField<CountermeasureFieldKey>[];
