import type { A3BlockContent, A3EntrySummary, A3TextLine } from "../../a3/methodContract";
import { resolveA3Language } from "../../a3/methodContract";
import { fieldFormLines } from "../shared/fieldForm";
import { statusGlyphText } from "../shared/statusGlyph";
import { COST_APPROVAL_FIELDS, COST_APPROVAL_STATUS_TONE } from "./fields";
import type { CostApprovalPayload } from "./schema";

export function renderCostApprovalToA3(payload: CostApprovalPayload, entry: A3EntrySummary): A3BlockContent {
  const language = resolveA3Language(entry);
  const tone = COST_APPROVAL_STATUS_TONE[payload.approvalStatus.trim()];
  const titleLine: A3TextLine = tone
    ? { text: statusGlyphText(entry.title, tone), bold: true, tone }
    : { text: entry.title, bold: true };

  return {
    lines: [titleLine, ...fieldFormLines(payload, COST_APPROVAL_FIELDS, language)],
  };
}
