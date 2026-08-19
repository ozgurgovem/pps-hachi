import type { A3BlockContent, A3EntrySummary } from "../../a3/methodContract";
import { resolveA3Language } from "../../a3/methodContract";
import { fieldFormLines } from "../shared/fieldForm";
import { REALIZED_COST_BENEFIT_FIELDS } from "./fields";
import type { RealizedCostBenefitPayload } from "./schema";

export function renderRealizedCostBenefitToA3(payload: RealizedCostBenefitPayload, entry: A3EntrySummary): A3BlockContent {
  const language = resolveA3Language(entry);
  return {
    lines: [{ text: entry.title, bold: true }, ...fieldFormLines(payload, REALIZED_COST_BENEFIT_FIELDS, language)],
  };
}
