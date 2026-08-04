import type { A3BlockContent, A3EntrySummary } from "../../a3/methodContract";
import { fieldFormLines } from "../shared/fieldForm";
import { COUNTERMEASURE_FIELDS, COUNTERMEASURE_STATUS_EXPORT_LABELS } from "./fields";
import type { CountermeasurePayload } from "./schema";

export function renderCountermeasureToA3(payload: CountermeasurePayload, entry: A3EntrySummary): A3BlockContent {
  const status = payload.status.trim();
  const values = {
    ...payload,
    status: status.length > 0 ? (COUNTERMEASURE_STATUS_EXPORT_LABELS[status] ?? status) : status,
  };

  return {
    lines: [{ text: entry.title, bold: true }, ...fieldFormLines(values, COUNTERMEASURE_FIELDS)],
  };
}
