import type { FieldFormField } from "../shared/fieldForm";

export type ActionItemFieldKey =
  | "action"
  | "owner"
  | "startDate"
  | "dueDate"
  | "percentComplete"
  | "evidence";

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
  { key: "action", labelKey: "methods.actionItem.fields.action", exportLabel: "Action", type: "textarea", wide: true },
  { key: "owner", labelKey: "methods.actionItem.fields.owner", exportLabel: "Owner", type: "text" },
  { key: "startDate", labelKey: "methods.actionItem.fields.startDate", exportLabel: "Start", type: "date" },
  { key: "dueDate", labelKey: "methods.actionItem.fields.dueDate", exportLabel: "Due", type: "date" },
  {
    key: "percentComplete",
    labelKey: "methods.actionItem.fields.percentComplete",
    exportLabel: "Status %",
    type: "text",
  },
  {
    key: "evidence",
    labelKey: "methods.actionItem.fields.evidence",
    exportLabel: "Evidence",
    type: "textarea",
    wide: true,
  },
] as const satisfies readonly FieldFormField<ActionItemFieldKey>[];
