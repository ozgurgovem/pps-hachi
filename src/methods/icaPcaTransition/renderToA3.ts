import type { A3BlockContent, A3EntrySummary } from "../../a3/methodContract";
import { fieldFormLines } from "../shared/fieldForm";
import { ICA_PCA_STATUS_EXPORT_LABELS, ICA_PCA_TRANSITION_FIELDS } from "./fields";
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

  return {
    lines: [{ text: entry.title, bold: true }, ...fieldFormLines(values, ICA_PCA_TRANSITION_FIELDS)],
  };
}
