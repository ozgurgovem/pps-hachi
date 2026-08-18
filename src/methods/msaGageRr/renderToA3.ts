import type { A3BlockContent, A3EntrySummary, A3Language, A3TextLine } from "../../a3/methodContract";
import { resolveA3Language } from "../../a3/methodContract";
import type { MsaGageRrVerdict } from "./verdicts";
import type { MsaGageRrPayload } from "./schema";

/** D-188/P-26: matches `methods.msaGageRr.verdicts.*`'s own editor translations. */
const VERDICT_LABELS: Readonly<Record<MsaGageRrVerdict, Readonly<Record<A3Language, string>>>> = {
  trustworthy: { tr: "Güvenilir", en: "Trustworthy" },
  notTrustworthy: { tr: "Güvenilir değil", en: "Not trustworthy" },
  inconclusive: { tr: "Belirsiz", en: "Inconclusive" },
};

/** D-188/P-26: matches `methods.msaGageRr.{method,evaluator,date,percentGrr}Label`'s own editor translations. */
const FIELD_ORDER = [
  ["method", { tr: "Yöntem", en: "Method" }],
  ["evaluator", { tr: "Değerlendiren", en: "Evaluator" }],
  ["date", { tr: "Tarih", en: "Date" }],
  ["percentGrr", { tr: "% GRR", en: "% GRR" }],
] as const satisfies readonly (readonly [keyof MsaGageRrPayload, Readonly<Record<A3Language, string>>])[];

/** D-188/P-26: matches `methods.msaGageRr.noteLabel`'s own editor translation. */
const NOTE_LABEL: Readonly<Record<A3Language, string>> = { tr: "Not", en: "Note" };

/** D-188/P-26: matches `methods.msaGageRr.verdictLabel`'s own editor translation. */
const VERDICT_PREFIX: Readonly<Record<A3Language, string>> = { tr: "Sonuç", en: "Verdict" };

export function renderMsaGageRrToA3(payload: MsaGageRrPayload, entry: A3EntrySummary): A3BlockContent {
  const language = resolveA3Language(entry);
  const fieldLines: A3TextLine[] = FIELD_ORDER.filter(([key]) => payload[key].trim().length > 0).map(
    ([key, label]) => ({ text: `${label[language]}: ${payload[key]}` }),
  );
  const noteLine = payload.note.trim().length > 0 ? [{ text: `${NOTE_LABEL[language]}: ${payload.note}` }] : [];

  return {
    lines: [
      { text: entry.title, bold: true },
      { text: `${VERDICT_PREFIX[language]}: ${VERDICT_LABELS[payload.verdict][language]}` },
      ...fieldLines,
      ...noteLine,
    ],
  };
}
