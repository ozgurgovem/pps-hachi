import type { RowTableSelectOption } from "./rowTable";

/**
 * TEMPLATE_ANALYSIS.md §13.2 `Lists & Settings` — the Status/Approval/Yes-No
 * dictionaries the reference form reuses across its Action Plan, Root Cause
 * and Standardization pages. C4 introduces two ADIM 8 methods
 * (`documentUpdatesTracker`, `yokotenTracker`) that each carry a `Status`
 * and/or `Approval` column drawn from this exact dictionary — the second
 * repetition Anayasa Madde 2 says to abstract on sight, same reasoning
 * D-115/D-127 already applied to `rowTable`/`fieldForm` themselves.
 */
export const DOCUMENT_STATUS_OPTIONS = [
  { value: "notStarted", labelKey: "methods.documentStatus.notStarted" },
  { value: "inProgress", labelKey: "methods.documentStatus.inProgress" },
  { value: "blocked", labelKey: "methods.documentStatus.blocked" },
  { value: "complete", labelKey: "methods.documentStatus.complete" },
  { value: "cancelled", labelKey: "methods.documentStatus.cancelled" },
] as const satisfies readonly RowTableSelectOption[];

export const DOCUMENT_APPROVAL_OPTIONS = [
  { value: "draft", labelKey: "methods.documentApproval.draft" },
  { value: "underReview", labelKey: "methods.documentApproval.underReview" },
  { value: "approved", labelKey: "methods.documentApproval.approved" },
  { value: "rejected", labelKey: "methods.documentApproval.rejected" },
] as const satisfies readonly RowTableSelectOption[];

// "no" first: `emptyFieldFormValues` defaults a select to its first option
// (D-127), and a fresh row presuming "update required" / "customer
// submission" before anyone has confirmed either is the wrong default.
export const YES_NO_OPTIONS = [
  { value: "no", labelKey: "methods.yesNo.no" },
  { value: "yes", labelKey: "methods.yesNo.yes" },
] as const satisfies readonly RowTableSelectOption[];
