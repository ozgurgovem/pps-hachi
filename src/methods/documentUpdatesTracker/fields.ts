import { DOCUMENT_APPROVAL_OPTIONS, DOCUMENT_STATUS_OPTIONS, YES_NO_OPTIONS } from "../shared/documentStatusOptions";
import type { FieldFormField } from "../shared/fieldForm";

export type DocumentUpdateFieldKey =
  | "updateRequired"
  | "docId"
  | "revision"
  | "owner"
  | "dueDate"
  | "status"
  | "approval"
  | "evidence"
  | "customerSubmission";

/**
 * TEMPLATE_ANALYSIS.md §13.1: "Update required? (Yes/No) · Doc ID ·
 * Current→New revision · Owner · Due/Completion date · Status · Approval ·
 * Evidence · Customer submission? (Yes/No)" — the same nine fields for
 * every one of the seven fixed document types (`documentTypes.ts`).
 */
export const DOCUMENT_UPDATE_FIELDS = [
  {
    key: "updateRequired",
    labelKey: "methods.documentUpdatesTracker.fields.updateRequired",
    exportLabel: "Update required?",
    type: "select",
    options: YES_NO_OPTIONS,
  },
  { key: "docId", labelKey: "methods.documentUpdatesTracker.fields.docId", exportLabel: "Doc ID", type: "text" },
  {
    key: "revision",
    labelKey: "methods.documentUpdatesTracker.fields.revision",
    exportLabel: "Current → new revision",
    type: "text",
  },
  { key: "owner", labelKey: "methods.documentUpdatesTracker.fields.owner", exportLabel: "Owner", type: "text" },
  {
    key: "dueDate",
    labelKey: "methods.documentUpdatesTracker.fields.dueDate",
    exportLabel: "Due / completion date",
    type: "date",
  },
  {
    key: "status",
    labelKey: "methods.documentUpdatesTracker.fields.status",
    exportLabel: "Status",
    type: "select",
    options: DOCUMENT_STATUS_OPTIONS,
  },
  {
    key: "approval",
    labelKey: "methods.documentUpdatesTracker.fields.approval",
    exportLabel: "Approval",
    type: "select",
    options: DOCUMENT_APPROVAL_OPTIONS,
  },
  {
    key: "evidence",
    labelKey: "methods.documentUpdatesTracker.fields.evidence",
    exportLabel: "Evidence",
    type: "text",
  },
  {
    key: "customerSubmission",
    labelKey: "methods.documentUpdatesTracker.fields.customerSubmission",
    exportLabel: "Customer submission?",
    type: "select",
    options: YES_NO_OPTIONS,
  },
] as const satisfies readonly FieldFormField<DocumentUpdateFieldKey>[];
