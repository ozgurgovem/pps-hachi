import type { A3BlockContent, A3EntrySummary } from "../../a3/methodContract";
import { rowTableLines } from "../shared/rowTable";
import { CONTAINMENT_ICA_COLUMNS } from "./columns";
import type { ContainmentIcaPayload } from "./schema";

export function renderContainmentIcaToA3(payload: ContainmentIcaPayload, entry: A3EntrySummary): A3BlockContent {
  return {
    lines: [{ text: entry.title, bold: true }, ...rowTableLines(payload.rows, CONTAINMENT_ICA_COLUMNS)],
  };
}
