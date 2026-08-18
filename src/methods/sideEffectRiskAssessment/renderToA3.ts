import type { A3BlockContent, A3EntrySummary } from "../../a3/methodContract";
import { resolveA3Language } from "../../a3/methodContract";
import { fieldFormLines } from "../shared/fieldForm";
import { SIDE_EFFECT_RISK_ASSESSMENT_FIELDS } from "./fields";
import type { SideEffectRiskAssessmentPayload } from "./schema";

export function renderSideEffectRiskAssessmentToA3(
  payload: SideEffectRiskAssessmentPayload,
  entry: A3EntrySummary,
): A3BlockContent {
  const language = resolveA3Language(entry);
  return {
    lines: [{ text: entry.title, bold: true }, ...fieldFormLines(payload, SIDE_EFFECT_RISK_ASSESSMENT_FIELDS, language)],
  };
}
