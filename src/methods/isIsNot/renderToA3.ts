import type { A3BlockContent, A3EntrySummary, A3TextLine } from "../../a3/methodContract";
import { IS_IS_NOT_DIMENSIONS } from "./dimensions";
import type { IsIsNotPayload } from "./schema";

const DIMENSION_LABELS: Readonly<Record<string, string>> = {
  what: "What",
  where: "Where",
  when: "When",
  extent: "Extent",
};

export function renderIsIsNotToA3(payload: IsIsNotPayload, entry: A3EntrySummary): A3BlockContent {
  const rowLines: A3TextLine[] = IS_IS_NOT_DIMENSIONS.filter(
    ([, isKey, isNotKey]) => payload[isKey].trim().length > 0 || payload[isNotKey].trim().length > 0,
  ).map(([dimension, isKey, isNotKey]) => ({
    text: `${DIMENSION_LABELS[dimension]} — Is: ${payload[isKey]} · Is Not: ${payload[isNotKey]}`,
  }));

  return {
    lines: [{ text: entry.title, bold: true }, ...rowLines],
  };
}
