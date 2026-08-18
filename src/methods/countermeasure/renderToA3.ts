import type { A3BlockContent, A3EntrySummary, A3TextLine } from "../../a3/methodContract";
import { resolveA3Language } from "../../a3/methodContract";
import { fieldFormLines } from "../shared/fieldForm";
import { statusGlyphText } from "../shared/statusGlyph";
import { COUNTERMEASURE_FIELDS, COUNTERMEASURE_STATUS_EXPORT_LABELS, COUNTERMEASURE_STATUS_TONE } from "./fields";
import type { CountermeasurePayload } from "./schema";

export function renderCountermeasureToA3(payload: CountermeasurePayload, entry: A3EntrySummary): A3BlockContent {
  const language = resolveA3Language(entry);
  const status = payload.status.trim();
  const values = {
    ...payload,
    status: status.length > 0 ? (COUNTERMEASURE_STATUS_EXPORT_LABELS[status]?.[language] ?? status) : status,
  };
  const tone = COUNTERMEASURE_STATUS_TONE[status];
  const titleLine: A3TextLine = tone
    ? { text: statusGlyphText(entry.title, tone), bold: true, tone }
    : { text: entry.title, bold: true };

  return {
    lines: [titleLine, ...fieldFormLines(values, COUNTERMEASURE_FIELDS, language)],
  };
}
