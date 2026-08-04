import type { A3BlockContent, A3EntrySummary } from "../../a3/methodContract";
import { treeLines } from "../shared/nodeTree";
import type { WhyWhyTreePayload } from "./schema";

export function renderWhyWhyTreeToA3(payload: WhyWhyTreePayload, entry: A3EntrySummary): A3BlockContent {
  return {
    lines: [{ text: entry.title, bold: true }, ...treeLines(payload.nodes)],
  };
}
