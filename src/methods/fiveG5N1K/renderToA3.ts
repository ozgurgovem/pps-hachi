import type { A3BlockContent, A3EntrySummary, A3Language, A3TextLine } from "../../a3/methodContract";
import { resolveA3Language } from "../../a3/methodContract";
import type { FiveG5N1KPayload } from "./schema";

/**
 * D-188/P-26: the 5G romanized terms (Gemba/Gembutsu/Genjitsu/Genri/Gensoku)
 * stay identical in both languages — `methods.fiveG5N1K.fields.*`'s own TR
 * and EN editor translations keep the same Japanese term, only the
 * parenthetical gloss differs. The 5N1K question words did **not** — they
 * were hardcoded Turkish even in an English-language project (the bug P-26
 * itself flags as bidirectional), so those six now vary with `entry.language`
 * to match `methods.fiveG5N1K.fields.{ne,nerede,nasil,neZaman,neKadar,kim}`.
 *
 * A literal tuple, not `Object.keys(...)`: `FiveG5N1KPayload` is inferred
 * from a `z.looseObject` (D-51), which widens `keyof` to `string` via its
 * passthrough index signature — indexing with that widened `string` would
 * type `payload[key]` as `unknown`, not the named field's `string`.
 */
const FIELD_ORDER = [
  ["gemba", { tr: "Gemba", en: "Gemba" }],
  ["gembutsu", { tr: "Gembutsu", en: "Gembutsu" }],
  ["genjitsu", { tr: "Genjitsu", en: "Genjitsu" }],
  ["genri", { tr: "Genri", en: "Genri" }],
  ["gensoku", { tr: "Gensoku", en: "Gensoku" }],
  ["ne", { tr: "Ne", en: "What" }],
  ["nerede", { tr: "Nerede", en: "Where" }],
  ["nasil", { tr: "Nasıl", en: "How" }],
  ["neZaman", { tr: "Ne zaman", en: "When" }],
  ["neKadar", { tr: "Ne kadar", en: "How much" }],
  ["kim", { tr: "Kim", en: "Who" }],
] as const satisfies readonly (readonly [keyof FiveG5N1KPayload, Readonly<Record<A3Language, string>>])[];

export function renderFiveG5N1KToA3(payload: FiveG5N1KPayload, entry: A3EntrySummary): A3BlockContent {
  const language = resolveA3Language(entry);
  const fieldLines: A3TextLine[] = FIELD_ORDER.filter(([key]) => payload[key].trim().length > 0).map(
    ([key, label]) => ({ text: `${label[language]}: ${payload[key]}` }),
  );

  return {
    lines: [{ text: entry.title, bold: true }, ...fieldLines],
  };
}
