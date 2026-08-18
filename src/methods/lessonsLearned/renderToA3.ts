import type { A3BlockContent, A3EntrySummary } from "../../a3/methodContract";
import { resolveA3Language } from "../../a3/methodContract";
import { fieldFormLines } from "../shared/fieldForm";
import { LESSONS_LEARNED_FIELDS } from "./fields";
import type { LessonsLearnedPayload } from "./schema";

export function renderLessonsLearnedToA3(payload: LessonsLearnedPayload, entry: A3EntrySummary): A3BlockContent {
  const language = resolveA3Language(entry);
  return {
    lines: [{ text: entry.title, bold: true }, ...fieldFormLines(payload, LESSONS_LEARNED_FIELDS, language)],
  };
}
