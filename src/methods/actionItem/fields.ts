import type { FieldFormField } from "../shared/fieldForm";

export type ActionItemFieldKey =
  | "action"
  | "owner"
  | "startDate"
  | "dueDate"
  | "percentComplete"
  | "evidence"
  | "customerApproval";

/**
 * §13.4 candidate 6 (`reference/TEMPLATE_ANALYSIS.md`, Oturum C/C1): the
 * reference form's action table carries a customer sign-off column this one
 * didn't. `"Days late"` — B1's other candidate 6 field — is deliberately
 * **not** added here: it is calculated relative to today's date, and
 * `renderToA3` must stay pure/deterministic (no `Date.now()`, golden-file
 * tests assume it) — left for whichever future change threads an explicit
 * `asOf` date through the export pipeline.
 */
export const ACTION_ITEM_CUSTOMER_APPROVAL_OPTIONS = [
  { value: "pending", labelKey: "methods.actionItem.customerApprovals.pending" },
  { value: "approved", labelKey: "methods.actionItem.customerApprovals.approved" },
  { value: "rejected", labelKey: "methods.actionItem.customerApprovals.rejected" },
] as const;

/**
 * SPEC.md §1.3 (Step 6): "Action plan table / Gantt (action, owner, start,
 * due, status %, evidence)" — one action per entry, for the same reason a
 * countermeasure is one per entry: §4.2 says "an action holds
 * `countermeasureId`", and a reference lives on an `Entry` (D-116), so an
 * action must *be* one to carry its own link. §1.2 S6 ("flag any action with
 * no owner or no due date") is likewise a per-action rule.
 *
 * `percentComplete` stays a plain string per D-120 — nothing sums or plots
 * it in 6b.
 */
export const ACTION_ITEM_FIELDS = [
  {
    key: "action",
    labelKey: "methods.actionItem.fields.action",
    exportLabel: { tr: "Aksiyon", en: "Action" },
    type: "textarea",
    wide: true,
  },
  { key: "owner", labelKey: "methods.actionItem.fields.owner", exportLabel: { tr: "Sorumlu", en: "Owner" }, type: "text" },
  {
    key: "startDate",
    labelKey: "methods.actionItem.fields.startDate",
    exportLabel: { tr: "Başlangıç", en: "Start" },
    type: "date",
  },
  {
    key: "dueDate",
    labelKey: "methods.actionItem.fields.dueDate",
    exportLabel: { tr: "Termin", en: "Due" },
    type: "date",
  },
  {
    key: "percentComplete",
    labelKey: "methods.actionItem.fields.percentComplete",
    exportLabel: { tr: "Durum %", en: "Status %" },
    type: "text",
  },
  {
    key: "evidence",
    labelKey: "methods.actionItem.fields.evidence",
    exportLabel: { tr: "Kanıt", en: "Evidence" },
    type: "textarea",
    wide: true,
  },
  {
    key: "customerApproval",
    labelKey: "methods.actionItem.fields.customerApproval",
    exportLabel: { tr: "Müşteri onayı", en: "Customer approval" },
    type: "select",
    options: ACTION_ITEM_CUSTOMER_APPROVAL_OPTIONS,
  },
] as const satisfies readonly FieldFormField<ActionItemFieldKey>[];
