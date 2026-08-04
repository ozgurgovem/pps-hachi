import type { A3BlockContent, A3EntrySummary, A3TextLine } from "../../a3/methodContract";
import { HYPOTHESIS_VERDICT_EXPORT_LABELS } from "./columns";
import type { HypothesisVerificationPayload, HypothesisVerificationRow } from "./schema";

/**
 * Not `rowTableLines`: the verdict is the point of this table, so it leads
 * each line rather than trailing it, and a confirmed cause is bolded — an
 * auditor reading the printed A3 should find the promoted root causes without
 * reading every row.
 */
function rowLine(row: HypothesisVerificationRow): A3TextLine | undefined {
  const parts = [row.candidateCause, row.verificationMethod, row.evidence]
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  if (parts.length === 0) {
    return undefined;
  }

  const verdict = row.verdict.trim();
  const marker = verdict.length > 0 ? `[${HYPOTHESIS_VERDICT_EXPORT_LABELS[verdict] ?? verdict}] ` : "";

  return { text: `${marker}${parts.join(" · ")}`, ...(verdict === "confirmed" ? { bold: true } : {}) };
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
