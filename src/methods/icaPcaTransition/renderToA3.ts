import type { A3BlockContent, A3EntrySummary, A3TextLine } from "../../a3/methodContract";
import { fieldFormLines } from "../shared/fieldForm";
import { statusGlyphText } from "../shared/statusGlyph";
import { ICA_PCA_STATUS_EXPORT_LABELS, ICA_PCA_STATUS_TONE, ICA_PCA_TRANSITION_FIELDS } from "./fields";
import type { IcaPcaTransitionPayload } from "./schema";

export function renderIcaPcaTransitionToA3(
  payload: IcaPcaTransitionPayload,
  entry: A3EntrySummary,
): A3BlockContent {
  const status = payload.status.trim();
  const values = {
    ...payload,
    status: status.length > 0 ? (ICA_PCA_STATUS_EXPORT_LABELS[status] ?? status) : status,
  };
  const tone = ICA_PCA_STATUS_TONE[status];
  const titleLine: A3TextLine = tone
    ? { text: statusGlyphText(entry.title, tone), bold: true, tone }
    : { text: entry.title, bold: true };

  return {
    lines: [titleLine, ...fieldFormLines(values, ICA_PCA_TRANSITION_FIELDS)],
  };
}
