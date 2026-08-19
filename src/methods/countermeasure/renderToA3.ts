import type { A3BlockContent, A3EntrySummary, A3Language, A3TextLine } from "../../a3/methodContract";
import { resolveA3Language } from "../../a3/methodContract";
import { fieldFormLines } from "../shared/fieldForm";
import { statusGlyphText } from "../shared/statusGlyph";
import {
  COUNTERMEASURE_FIELDS,
  COUNTERMEASURE_PRIORITY_DECISION_EXPORT_LABELS,
  COUNTERMEASURE_PRIORITY_DECISION_TONE,
  COUNTERMEASURE_STATUS_EXPORT_LABELS,
  COUNTERMEASURE_STATUS_TONE,
} from "./fields";
import { priorityScoreOf } from "./priorityScore";
import type { CountermeasurePayload } from "./schema";

const PRIORITY_SCORE_LABEL: Readonly<Record<A3Language, string>> = { tr: "Öncelik Puanı", en: "Priority score" };

export function renderCountermeasureToA3(payload: CountermeasurePayload, entry: A3EntrySummary): A3BlockContent {
  const language = resolveA3Language(entry);
  const status = payload.status.trim();
  // `?? ""` (not a plain `.trim()`): an entry created before this field
  // existed has it genuinely `undefined` at runtime (`Entry.payload` is
  // never Zod-validated on load, D-52) — same guard C1 added project-wide
  // for the same shape of bug in `RowTableEditor.tsx`.
  const priorityDecision = (payload.priorityDecision ?? "").trim();
  const values = {
    ...payload,
    status: status.length > 0 ? (COUNTERMEASURE_STATUS_EXPORT_LABELS[status]?.[language] ?? status) : status,
    priorityDecision:
      priorityDecision.length > 0
        ? (COUNTERMEASURE_PRIORITY_DECISION_EXPORT_LABELS[priorityDecision]?.[language] ?? priorityDecision)
        : priorityDecision,
  };
  const tone = COUNTERMEASURE_STATUS_TONE[status];
  const titleLine: A3TextLine = tone
    ? { text: statusGlyphText(entry.title, tone), bold: true, tone }
    : { text: entry.title, bold: true };

  // The priority score's own summary line gets `priorityDecision`'s glyph —
  // `status`'s glyph already owns the title, and only one glyph per line.
  const score = priorityScoreOf(payload);
  const decisionTone = COUNTERMEASURE_PRIORITY_DECISION_TONE[priorityDecision];
  const scoreLine: A3TextLine | undefined =
    score === undefined
      ? undefined
      : decisionTone
        ? { text: statusGlyphText(`${PRIORITY_SCORE_LABEL[language]}: ${score}`, decisionTone), tone: decisionTone }
        : { text: `${PRIORITY_SCORE_LABEL[language]}: ${score}` };

  return {
    lines: [titleLine, ...fieldFormLines(values, COUNTERMEASURE_FIELDS, language), ...(scoreLine ? [scoreLine] : [])],
  };
}
