import type { A3BlockContent, A3EntrySummary } from "../../a3/methodContract";
import { resolveA3Language } from "../../a3/methodContract";
import { fieldFormLines } from "../shared/fieldForm";
import { PFMEA_LINKAGE_FIELDS } from "./fields";
import type { PfmeaLinkagePayload } from "./schema";

export function renderPfmeaLinkageToA3(payload: PfmeaLinkagePayload, entry: A3EntrySummary): A3BlockContent {
  const language = resolveA3Language(entry);
  return {
    lines: [{ text: entry.title, bold: true }, ...fieldFormLines(payload, PFMEA_LINKAGE_FIELDS, language)],
  };
}
