import type { A3BlockContent, A3EntrySummary, A3TextLine } from "../../a3/methodContract";
import { resolveA3Language } from "../../a3/methodContract";
import { QUADRANT_EXPORT_LABELS, quadrantOf } from "./quadrant";
import type { ImpactEffortMatrixPayload } from "./schema";

export function renderImpactEffortMatrixToA3(
  payload: ImpactEffortMatrixPayload,
  entry: A3EntrySummary,
): A3BlockContent {
  const language = resolveA3Language(entry);
  const itemLines: A3TextLine[] = payload.items
    .filter((item) => item.description.trim().length > 0)
    .map((item) => {
      const quadrant = quadrantOf(item);
      const description = item.description.trim();
      return { text: quadrant ? `${description} — ${QUADRANT_EXPORT_LABELS[quadrant][language]}` : description };
    });

  return {
    lines: [{ text: entry.title, bold: true }, ...itemLines],
  };
}
