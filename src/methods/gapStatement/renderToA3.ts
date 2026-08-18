import type { A3BlockContent, A3EntrySummary, A3Language, A3TextLine } from "../../a3/methodContract";
import { resolveA3Language } from "../../a3/methodContract";
import type { GapStatementPayload } from "./schema";

/** D-188/P-26: matches `methods.gapStatement.{ideal,actual,gap}Label`'s own editor translations. */
const FIELD_ORDER = [
  ["ideal", { tr: "İdeal", en: "Ideal" }],
  ["actual", { tr: "Mevcut", en: "Actual" }],
  ["gap", { tr: "Boşluk", en: "Gap" }],
] as const satisfies readonly (readonly [keyof GapStatementPayload, Readonly<Record<A3Language, string>>])[];

export function renderGapStatementToA3(payload: GapStatementPayload, entry: A3EntrySummary): A3BlockContent {
  const language = resolveA3Language(entry);
  const fieldLines: A3TextLine[] = FIELD_ORDER.filter(([key]) => payload[key].trim().length > 0).map(
    ([key, label]) => ({ text: `${label[language]}: ${payload[key]}` }),
  );

  return {
    lines: [{ text: entry.title, bold: true }, ...fieldLines],
  };
}
