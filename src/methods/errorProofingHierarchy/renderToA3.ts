import type { A3BlockContent, A3EntrySummary, A3Language } from "../../a3/methodContract";
import { resolveA3Language } from "../../a3/methodContract";
import { ERROR_PROOFING_LEVEL_EXPORT_LABELS } from "./levels";
import type { ErrorProofingHierarchyPayload } from "./schema";

/** D-188/P-26: matches `methods.errorProofingHierarchy.levelLabel`'s own editor translation, abbreviated to match the existing "Level" export prefix. */
const LEVEL_PREFIX: Readonly<Record<A3Language, string>> = { tr: "Seviye", en: "Level" };

export function renderErrorProofingHierarchyToA3(
  payload: ErrorProofingHierarchyPayload,
  entry: A3EntrySummary,
): A3BlockContent {
  const language = resolveA3Language(entry);
  const levelLine = { text: `${LEVEL_PREFIX[language]}: ${ERROR_PROOFING_LEVEL_EXPORT_LABELS[payload.level][language]}` };
  const noteLine = payload.note.trim().length > 0 ? [{ text: payload.note.trim() }] : [];

  return {
    lines: [{ text: entry.title, bold: true }, levelLine, ...noteLine],
  };
}
