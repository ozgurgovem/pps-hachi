import type { A3BlockContent, A3EntrySummary } from "../../a3/methodContract";
import { rowTableLines } from "../shared/rowTable";
import { PROCESS_FLOW_SIPOC_COLUMNS } from "./columns";
import type { ProcessFlowSipocPayload } from "./schema";

export function renderProcessFlowSipocToA3(payload: ProcessFlowSipocPayload, entry: A3EntrySummary): A3BlockContent {
  return {
    lines: [{ text: entry.title, bold: true }, ...rowTableLines(payload.rows, PROCESS_FLOW_SIPOC_COLUMNS)],
  };
}
