import type { A3BlockContent, A3EntrySummary, A3Language, A3TextLine } from "../../a3/methodContract";
import { resolveA3Language } from "../../a3/methodContract";
import { IS_IS_NOT_DIMENSIONS } from "./dimensions";
import type { IsIsNotPayload } from "./schema";

/**
 * D-188/P-26: the Kepner-Tregoe terms "Is"/"Is Not" stay in English even in
 * the Turkish editor (`methods.isIsNot.{isLabel,isNotLabel}` — "Is (Öyle)" /
 * "Is Not (Değil)"), so the export mirrors that same bilingual-gloss
 * convention rather than inventing a pure-Turkish translation the editor
 * itself doesn't use.
 */
const DIMENSION_LABELS: Readonly<Record<string, Readonly<Record<A3Language, string>>>> = {
  what: { tr: "What (Ne)", en: "What" },
  where: { tr: "Where (Nerede)", en: "Where" },
  when: { tr: "When (Ne zaman)", en: "When" },
  extent: { tr: "Extent (Kapsam)", en: "Extent" },
};

const IS_LABEL: Readonly<Record<A3Language, string>> = { tr: "Is (Öyle)", en: "Is" };
const IS_NOT_LABEL: Readonly<Record<A3Language, string>> = { tr: "Is Not (Değil)", en: "Is Not" };

export function renderIsIsNotToA3(payload: IsIsNotPayload, entry: A3EntrySummary): A3BlockContent {
  const language = resolveA3Language(entry);
  const rowLines: A3TextLine[] = IS_IS_NOT_DIMENSIONS.filter(
    ([, isKey, isNotKey]) => payload[isKey].trim().length > 0 || payload[isNotKey].trim().length > 0,
  ).map(([dimension, isKey, isNotKey]) => ({
    text: `${DIMENSION_LABELS[dimension]?.[language]} — ${IS_LABEL[language]}: ${payload[isKey]} · ${IS_NOT_LABEL[language]}: ${payload[isNotKey]}`,
  }));

  return {
    lines: [{ text: entry.title, bold: true }, ...rowLines],
  };
}
