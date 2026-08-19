import type { A3BlockContent, A3EntrySummary, A3TextLine } from "../../a3/methodContract";
import { resolveA3Language } from "../../a3/methodContract";
import { fieldFormLines } from "../shared/fieldForm";
import { statusGlyphText } from "../shared/statusGlyph";
import { RESULT_VERDICT_FIELDS, RESULT_VERDICT_STATUS_TONE } from "./fields";
import type { ResultVerdictPayload } from "./schema";

export function renderResultVerdictToA3(payload: ResultVerdictPayload, entry: A3EntrySummary): A3BlockContent {
  const language = resolveA3Language(entry);
  const tone = RESULT_VERDICT_STATUS_TONE[payload.verdict.trim()];
  const titleLine: A3TextLine = tone
    ? { text: statusGlyphText(entry.title, tone), bold: true, tone }
    : { text: entry.title, bold: true };

  return {
    lines: [titleLine, ...fieldFormLines(payload, RESULT_VERDICT_FIELDS, language)],
  };
}
