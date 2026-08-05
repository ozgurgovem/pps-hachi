import type { A3BlockContent, A3EntrySummary } from "../../a3/methodContract";
import { fieldFormLines } from "../shared/fieldForm";
import { TRIAL_PLAN_FIELDS } from "./fields";
import type { TrialPlanPayload } from "./schema";

export function renderTrialPlanToA3(payload: TrialPlanPayload, entry: A3EntrySummary): A3BlockContent {
  return {
    lines: [{ text: entry.title, bold: true }, ...fieldFormLines(payload, TRIAL_PLAN_FIELDS)],
  };
}
