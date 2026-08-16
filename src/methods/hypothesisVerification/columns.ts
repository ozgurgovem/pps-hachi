import type { RowTableColumn } from "../shared/rowTable";

/**
 * SPEC.md §1.3 (Step 4): "**Hypothesis verification table** — for each
 * candidate cause: verification method, evidence, verdict (confirmed /
 * rejected / inconclusive). A cause is only promoted to 'root cause' when
 * `verified = true`."
 *
 * The verdict is a closed set, so it is a `select` rather than free text —
 * §1.2 S4 flags a Step 4 with no confirmed cause, and a gate rule cannot read
 * "probably confirmed?" typed into a text box.
 */
export type HypothesisVerificationColumnKey =
  | "candidateCause"
  | "verificationMethod"
  | "evidence"
  | "verdict"
  | "confidencePercent"
  | "residualUncertainty"
  | "customerRelevance";

export const HYPOTHESIS_VERDICT_OPTIONS = [
  { value: "confirmed", labelKey: "methods.hypothesisVerification.verdicts.confirmed" },
  { value: "rejected", labelKey: "methods.hypothesisVerification.verdicts.rejected" },
  { value: "inconclusive", labelKey: "methods.hypothesisVerification.verdicts.inconclusive" },
] as const;

/** A3-side labels — `renderToA3` is i18n-free (D-43). */
export const HYPOTHESIS_VERDICT_EXPORT_LABELS: Readonly<Record<string, string>> = {
  confirmed: "CONFIRMED",
  rejected: "rejected",
  inconclusive: "inconclusive",
};

export const HYPOTHESIS_VERIFICATION_COLUMNS = [
  {
    key: "candidateCause",
    labelKey: "methods.hypothesisVerification.columns.candidateCause",
    type: "textarea",
  },
  {
    key: "verificationMethod",
    labelKey: "methods.hypothesisVerification.columns.verificationMethod",
    type: "textarea",
  },
  { key: "evidence", labelKey: "methods.hypothesisVerification.columns.evidence", type: "textarea" },
  {
    key: "verdict",
    labelKey: "methods.hypothesisVerification.columns.verdict",
    type: "select",
    options: HYPOTHESIS_VERDICT_OPTIONS,
  },
  {
    key: "confidencePercent",
    labelKey: "methods.hypothesisVerification.columns.confidencePercent",
    type: "text",
  },
  {
    key: "residualUncertainty",
    labelKey: "methods.hypothesisVerification.columns.residualUncertainty",
    type: "text",
  },
  {
    key: "customerRelevance",
    labelKey: "methods.hypothesisVerification.columns.customerRelevance",
    type: "text",
  },
] as const satisfies readonly RowTableColumn<HypothesisVerificationColumnKey>[];
