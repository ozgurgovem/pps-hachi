import type { FieldFormField } from "../shared/fieldForm";
import type { StatusTone } from "../shared/statusGlyph";

export type ResultVerdictFieldKey = "verdict" | "notes";

/**
 * `pending` isn't one of SPEC's own three verdict values — added first for
 * the same reason `costApproval/fields.ts`'s `approvalStatus` starts with
 * `pending` rather than one of SPEC's real outcomes: `emptyFieldFormValues`
 * defaults a select to its first option (D-127), and a fresh entry
 * presuming "target met" (or "not met") before anyone actually evaluated
 * the result would be a wrong default, the same class of bug D-183's
 * `YES_NO_OPTIONS` ordering fix already caught one method over.
 */
export const RESULT_VERDICT_STATUS_OPTIONS = [
  { value: "pending", labelKey: "methods.resultVerdict.statuses.pending" },
  { value: "met", labelKey: "methods.resultVerdict.statuses.met" },
  { value: "partiallyMet", labelKey: "methods.resultVerdict.statuses.partiallyMet" },
  { value: "notMet", labelKey: "methods.resultVerdict.statuses.notMet" },
] as const;

/** A3-side labels — `renderToA3` is i18n-free (D-43). */
export const RESULT_VERDICT_STATUS_EXPORT_LABELS: Readonly<Record<string, string>> = {
  pending: "Pending",
  met: "Target met",
  partiallyMet: "Partially met",
  notMet: "Not met",
};

/** P-37: D-41's shape-coded status marker, applied to the entry's title line. `pending` gets none — nothing to signal yet. */
export const RESULT_VERDICT_STATUS_TONE: Readonly<Record<string, StatusTone>> = {
  met: "positive",
  partiallyMet: "caution",
  notMet: "negative",
};

/** SPEC.md §1.3 (Step 7): "Verdict: target met / partially met / not met." */
export const RESULT_VERDICT_FIELDS = [
  {
    key: "verdict",
    labelKey: "methods.resultVerdict.fields.verdict",
    exportLabel: { tr: "Sonuç", en: "Verdict" },
    type: "select",
    options: RESULT_VERDICT_STATUS_OPTIONS,
  },
  {
    key: "notes",
    labelKey: "methods.resultVerdict.fields.notes",
    exportLabel: { tr: "Notlar", en: "Notes" },
    type: "textarea",
    wide: true,
  },
] as const satisfies readonly FieldFormField<ResultVerdictFieldKey>[];
