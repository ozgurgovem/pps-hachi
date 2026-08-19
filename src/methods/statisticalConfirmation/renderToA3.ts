import type { A3BlockContent, A3EntrySummary } from "../../a3/methodContract";
import { resolveA3Language } from "../../a3/methodContract";
import { fieldFormLines } from "../shared/fieldForm";
import { STATISTICAL_CONFIRMATION_FIELDS } from "./fields";
import type { StatisticalConfirmationPayload } from "./schema";

export function renderStatisticalConfirmationToA3(
  payload: StatisticalConfirmationPayload,
  entry: A3EntrySummary,
): A3BlockContent {
  const language = resolveA3Language(entry);
  return {
    lines: [{ text: entry.title, bold: true }, ...fieldFormLines(payload, STATISTICAL_CONFIRMATION_FIELDS, language)],
  };
}
