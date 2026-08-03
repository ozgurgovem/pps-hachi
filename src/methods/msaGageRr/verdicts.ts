/** SPEC.md §1.3 (Step 2): measurement system sanity check — is the data trustworthy? */
export const MSA_GAGE_RR_VERDICTS = ["trustworthy", "notTrustworthy", "inconclusive"] as const;
export type MsaGageRrVerdict = (typeof MSA_GAGE_RR_VERDICTS)[number];

/** i18next key for a verdict's display label. */
export function msaGageRrVerdictLabelKey(verdict: MsaGageRrVerdict): string {
  return `methods.msaGageRr.verdicts.${verdict}`;
}
