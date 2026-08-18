import type { A3BlockContent, A3EntrySummary, A3Language, A3TextLine } from "../../a3/methodContract";
import { resolveA3Language } from "../../a3/methodContract";
import { HYPOTHESIS_VERDICT_EXPORT_LABELS } from "./columns";
import type { HypothesisVerificationPayload, HypothesisVerificationRow } from "./schema";

/** D-188/P-26: matches `methods.hypothesisVerification.columns.*`'s own editor translations. */
const META_LABELS = {
  confidencePercent: { tr: "Güven", en: "Confidence" },
  residualUncertainty: { tr: "Kalan belirsizlik", en: "Residual uncertainty" },
  customerRelevance: { tr: "Müşteri önemi", en: "Customer relevance" },
} as const satisfies Record<string, Readonly<Record<A3Language, string>>>;

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
function rowLine(row: HypothesisVerificationRow, language: A3Language): A3TextLine | undefined {
  const parts = [row.candidateCause, row.verificationMethod, row.evidence]
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  const meta = [
    metaPart(META_LABELS.confidencePercent[language], row.confidencePercent),
    metaPart(META_LABELS.residualUncertainty[language], row.residualUncertainty),
    metaPart(META_LABELS.customerRelevance[language], row.customerRelevance),
  ].filter((value): value is string => value !== undefined);

  if (parts.length === 0 && meta.length === 0) {
    return undefined;
  }

  const verdict = row.verdict.trim();
  const marker = verdict.length > 0 ? `[${HYPOTHESIS_VERDICT_EXPORT_LABELS[verdict]?.[language] ?? verdict}] ` : "";
  const body = [parts.join(" · "), meta.join(" · ")].filter((segment) => segment.length > 0).join(" — ");

  return { text: `${marker}${body}`, ...(verdict === "confirmed" ? { bold: true } : {}) };
}

export function renderHypothesisVerificationToA3(
  payload: HypothesisVerificationPayload,
  entry: A3EntrySummary,
): A3BlockContent {
  const language = resolveA3Language(entry);
  const lines = payload.rows
    .map((row) => rowLine(row, language))
    .filter((line): line is A3TextLine => line !== undefined);

  return {
    lines: [{ text: entry.title, bold: true }, ...lines],
  };
}
