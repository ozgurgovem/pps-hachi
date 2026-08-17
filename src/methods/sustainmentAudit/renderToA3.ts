import type { A3BlockContent, A3EntrySummary } from "../../a3/methodContract";
import { rowTableLines } from "../shared/rowTable";
import { SUSTAINMENT_AUDIT_COLUMNS } from "./columns";
import type { SustainmentAuditPayload } from "./schema";

export function renderSustainmentAuditToA3(payload: SustainmentAuditPayload, entry: A3EntrySummary): A3BlockContent {
  return {
    lines: [{ text: entry.title, bold: true }, ...rowTableLines(payload.rows, SUSTAINMENT_AUDIT_COLUMNS)],
  };
}
