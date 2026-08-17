import type { A3BlockContent, A3EntrySummary, A3TextLine } from "../../a3/methodContract";
import { fieldFormLines } from "../shared/fieldForm";
import { DOCUMENT_TYPES, DOCUMENT_TYPE_EXPORT_LABELS } from "./documentTypes";
import { DOCUMENT_UPDATE_FIELDS } from "./fields";
import type { DocumentUpdatesTrackerPayload } from "./schema";

export function renderDocumentUpdatesTrackerToA3(
  payload: DocumentUpdatesTrackerPayload,
  entry: A3EntrySummary,
): A3BlockContent {
  const rowLines: A3TextLine[] = DOCUMENT_TYPES.flatMap((documentType) => {
    const fields = fieldFormLines(payload[documentType], DOCUMENT_UPDATE_FIELDS);
    // A document type with every field still blank contributes no export
    // noise — mirrors `tpmLossTaxonomy`'s "only the applied categories" rule,
    // just gated by "has any populated field" instead of a single boolean.
    if (fields.length === 0) return [];
    return [{ text: DOCUMENT_TYPE_EXPORT_LABELS[documentType], bold: true }, ...fields];
  });

  return {
    lines: [{ text: entry.title, bold: true }, ...rowLines],
  };
}
