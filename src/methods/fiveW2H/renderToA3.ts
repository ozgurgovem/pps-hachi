import type { A3BlockContent, A3EntrySummary, A3TextLine } from "../../a3/methodContract";
import type { FiveW2HPayload } from "./schema";

const FIELD_ORDER = [
  ["what", "What"],
  ["where", "Where"],
  ["when", "When"],
  ["who", "Who"],
  ["which", "Which"],
  ["how", "How"],
  ["howMuch", "How much"],
] as const satisfies readonly (readonly [keyof FiveW2HPayload, string])[];

export function renderFiveW2HToA3(payload: FiveW2HPayload, entry: A3EntrySummary): A3BlockContent {
  const fieldLines: A3TextLine[] = FIELD_ORDER.filter(([key]) => payload[key].trim().length > 0).map(
    ([key, label]) => ({ text: `${label}: ${payload[key]}` }),
  );

  return {
    lines: [{ text: entry.title, bold: true }, ...fieldLines],
  };
}
