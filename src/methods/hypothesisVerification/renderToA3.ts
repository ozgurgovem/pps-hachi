import type { A3BlockContent, A3EntrySummary, A3TextLine } from "../../a3/methodContract";
import { HYPOTHESIS_VERDICT_EXPORT_LABELS } from "./columns";
import type { HypothesisVerificationPayload, HypothesisVerificationRow } from "./schema";

/**
 * `?? ""` guards a row persisted before `confidencePercent`/
 * `residualUncertainty`/`customerRelevance` existed (B1's §13.4 candidate
 * 5) — an older `.ppsx` must still export, and `Entry.payload` is never
 * Zod-validated on load (D-52), so a legacy row genuinely has `undefined`
 * here, not `""`.
 */
function metaPart(label: string, value: string | undefined): string | undefined {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? `${label}: ${trimmed}` : undefined;
}

/**
 * Not `rowTableLines`: the verdict is the point of this table, so it leads
 * each line rather than trailing it, and a confirmed cause is bolded — an
 * auditor reading the printed A3 should find the promoted root causes without
 * reading every row. The three B1 candidate-5 fields are metrics, not
 * narrative, so they get their own labeled segment instead of joining the
 * unlabeled candidate/method/evidence triad.
 */
function rowLine(row: HypothesisVerificationRow): A3TextLine | undefined {
  const parts = [row.candidateCause, row.verificationMethod, row.evidence]
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  const meta = [
    metaPart("Confidence", row.confidencePercent),
    metaPart("Residual uncertainty", row.residualUncertainty),
    metaPart("Customer relevance", row.customerRelevance),
  ].filter((value): value is string => value !== undefined);

  if (parts.length === 0 && meta.length === 0) {
    return undefined;
  }

  const verdict = row.verdict.trim();
  const marker = verdict.length > 0 ? `[${HYPOTHESIS_VERDICT_EXPORT_LABELS[verdict] ?? verdict}] ` : "";
  const body = [parts.join(" · "), meta.join(" · ")].filter((segment) => segment.length > 0).join(" — ");

  return { text: `${marker}${body}`, ...(verdict === "confirmed" ? { bold: true } : {}) };
}

export function renderHypothesisVerificationToA3(
  payload: HypothesisVerificationPayload,
  entry: A3EntrySummary,
): A3BlockContent {
  const lines = payload.rows
    .map(rowLine)
    .filter((line): line is A3TextLine => line !== undefined);

  return {
    lines: [{ text: entry.title, bold: true }, ...lines],
  };
}
