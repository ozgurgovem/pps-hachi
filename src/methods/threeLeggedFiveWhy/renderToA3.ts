import type { A3BlockContent, A3EntrySummary, A3TextLine } from "../../a3/methodContract";
import { whyChainLines } from "../shared/whyChain";
import type { ThreeLeggedFiveWhyPayload } from "./schema";

const LEG_LABELS = [
  ["occurrence", "Occurrence"],
  ["detection", "Detection"],
  ["systemic", "Systemic"],
] as const satisfies readonly (readonly [keyof ThreeLeggedFiveWhyPayload, string])[];

export function renderThreeLeggedFiveWhyToA3(
  payload: ThreeLeggedFiveWhyPayload,
  entry: A3EntrySummary,
): A3BlockContent {
  const problemLine = payload.problemStatement.trim().length > 0 ? [{ text: payload.problemStatement }] : [];

  const legLines: A3TextLine[] = LEG_LABELS.flatMap(([key, label]) => {
    const lines = whyChainLines(payload[key]);
    return lines.length > 0 ? [{ text: label, bold: true }, ...lines] : [];
  });

  return {
    lines: [{ text: entry.title, bold: true }, ...problemLine, ...legLines],
  };
}
