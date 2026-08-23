import type { A3BlockContent, A3EntrySummary, A3Language, A3TextLine } from "../../a3/methodContract";
import { resolveA3Language } from "../../a3/methodContract";
import type { GapStatementPayload } from "./schema";

/** D-188/P-26: matches `methods.gapStatement.{ideal,actual,gap}Label`'s own editor translations. */
const FIELD_ORDER = [
  ["ideal", { tr: "İdeal", en: "Ideal" }],
  ["actual", { tr: "Mevcut", en: "Actual" }],
  ["gap", { tr: "Boşluk", en: "Gap" }],
] as const satisfies readonly (readonly [keyof GapStatementPayload, Readonly<Record<A3Language, string>>])[];

/** D-196: matches `methods.gapStatement.{unit,baselinePeriod}Label`'s own editor translations. `gapValue` is handled separately below — it isn't a string field. */
const TEXT_QUANT_FIELD_ORDER = [
  ["unit", { tr: "Birim", en: "Unit" }],
  ["baselinePeriod", { tr: "Baseline dönemi", en: "Baseline period" }],
] as const satisfies readonly (readonly [keyof GapStatementPayload, Readonly<Record<A3Language, string>>])[];

const GAP_VALUE_LABEL: Readonly<Record<A3Language, string>> = { tr: "Boşluk büyüklüğü", en: "Gap size" };

export function renderGapStatementToA3(payload: GapStatementPayload, entry: A3EntrySummary): A3BlockContent {
  const language = resolveA3Language(entry);
  const fieldLines: A3TextLine[] = FIELD_ORDER.filter(([key]) => payload[key].trim().length > 0).map(
    ([key, label]) => ({ text: `${label[language]}: ${payload[key]}` }),
  );
  const quantLines: A3TextLine[] = [
    ...(payload.gapValue !== 0 ? [{ text: `${GAP_VALUE_LABEL[language]}: ${payload.gapValue}` }] : []),
    ...TEXT_QUANT_FIELD_ORDER.filter(([key]) => payload[key].trim().length > 0).map(([key, label]) => ({
      text: `${label[language]}: ${payload[key]}`,
    })),
  ];

  return {
    lines: [{ text: entry.title, bold: true }, ...fieldLines, ...quantLines],
  };
}
