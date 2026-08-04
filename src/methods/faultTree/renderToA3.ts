import type { A3BlockContent, A3EntrySummary } from "../../a3/methodContract";
import { treeLines } from "../shared/nodeTree";
import { FAULT_TREE_GATE_MARKERS } from "./gates";
import type { FaultTreePayload } from "./schema";

export function renderFaultTreeToA3(payload: FaultTreePayload, entry: A3EntrySummary): A3BlockContent {
  return {
    lines: [
      { text: entry.title, bold: true },
      ...treeLines(payload.nodes, (node) => FAULT_TREE_GATE_MARKERS[node.gate] ?? ""),
    ],
  };
}
