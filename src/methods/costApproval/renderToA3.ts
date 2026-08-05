import type { A3BlockContent, A3EntrySummary } from "../../a3/methodContract";
import { fieldFormLines } from "../shared/fieldForm";
import { COST_APPROVAL_FIELDS } from "./fields";
import type { CostApprovalPayload } from "./schema";

export function renderCostApprovalToA3(payload: CostApprovalPayload, entry: A3EntrySummary): A3BlockContent {
  return {
    lines: [{ text: entry.title, bold: true }, ...fieldFormLines(payload, COST_APPROVAL_FIELDS)],
  };
}
