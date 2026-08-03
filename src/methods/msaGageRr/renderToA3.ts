import type { A3BlockContent, A3EntrySummary, A3TextLine } from "../../a3/methodContract";
import type { MsaGageRrVerdict } from "./verdicts";
import type { MsaGageRrPayload } from "./schema";

const VERDICT_LABELS: Readonly<Record<MsaGageRrVerdict, string>> = {
  trustworthy: "Trustworthy",
  notTrustworthy: "Not trustworthy",
  inconclusive: "Inconclusive",
};

const FIELD_ORDER = [
  ["method", "Method"],
  ["evaluator", "Evaluator"],
  ["date", "Date"],
  ["percentGrr", "% GRR"],
] as const satisfies readonly (readonly [keyof MsaGageRrPayload, string])[];

export function renderMsaGageRrToA3(payload: MsaGageRrPayload, entry: A3EntrySummary): A3BlockContent {
  const fieldLines: A3TextLine[] = FIELD_ORDER.filter(([key]) => payload[key].trim().length > 0).map(
    ([key, label]) => ({ text: `${label}: ${payload[key]}` }),
  );
  const noteLine = payload.note.trim().length > 0 ? [{ text: `Note: ${payload.note}` }] : [];

  return {
    lines: [
      { text: entry.title, bold: true },
      { text: `Verdict: ${VERDICT_LABELS[payload.verdict]}` },
      ...fieldLines,
      ...noteLine,
    ],
  };
}
