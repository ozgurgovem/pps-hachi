import type { A3BlockContent, A3EntrySummary } from "../../a3/methodContract";
import { ERROR_PROOFING_LEVEL_EXPORT_LABELS } from "./levels";
import type { ErrorProofingHierarchyPayload } from "./schema";

export function renderErrorProofingHierarchyToA3(
  payload: ErrorProofingHierarchyPayload,
  entry: A3EntrySummary,
): A3BlockContent {
  const levelLine = { text: `Level: ${ERROR_PROOFING_LEVEL_EXPORT_LABELS[payload.level]}` };
  const noteLine = payload.note.trim().length > 0 ? [{ text: payload.note.trim() }] : [];

  return {
    lines: [{ text: entry.title, bold: true }, levelLine, ...noteLine],
  };
}
