import type { A3BlockContent, A3EntrySummary, A3Language, A3TextLine } from "../../a3/methodContract";
import { resolveA3Language } from "../../a3/methodContract";
import type { FiveW2HPayload } from "./schema";

/** D-188/P-26: matches `methods.fiveW2H.fields.*`'s own editor translations. */
const FIELD_ORDER = [
  ["what", { tr: "Ne", en: "What" }],
  ["where", { tr: "Nerede", en: "Where" }],
  ["when", { tr: "Ne zaman", en: "When" }],
  ["who", { tr: "Kim", en: "Who" }],
  ["which", { tr: "Hangisi", en: "Which" }],
  ["how", { tr: "Nasıl", en: "How" }],
  ["howMuch", { tr: "Ne kadar", en: "How much" }],
] as const satisfies readonly (readonly [keyof FiveW2HPayload, Readonly<Record<A3Language, string>>])[];

export function renderFiveW2HToA3(payload: FiveW2HPayload, entry: A3EntrySummary): A3BlockContent {
  const language = resolveA3Language(entry);
  const fieldLines: A3TextLine[] = FIELD_ORDER.filter(([key]) => payload[key].trim().length > 0).map(
    ([key, label]) => ({ text: `${label[language]}: ${payload[key]}` }),
  );

  return {
    lines: [{ text: entry.title, bold: true }, ...fieldLines],
  };
}
