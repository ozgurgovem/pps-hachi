import type { A3BlockContent, A3EntrySummary } from "../../a3/methodContract";
import { resolveA3Language } from "../../a3/methodContract";
import { fieldFormLines } from "../shared/fieldForm";
import { SUSTAIN_PLAN_FIELDS } from "./fields";
import type { SustainPlanPayload } from "./schema";

export function renderSustainPlanToA3(payload: SustainPlanPayload, entry: A3EntrySummary): A3BlockContent {
  const language = resolveA3Language(entry);
  return {
    lines: [{ text: entry.title, bold: true }, ...fieldFormLines(payload, SUSTAIN_PLAN_FIELDS, language)],
  };
}
