import type { A3BlockContent, A3EntrySummary, A3TextLine } from "../../a3/methodContract";
import type { GapStatementPayload } from "./schema";

const FIELD_ORDER = [
  ["ideal", "Ideal"],
  ["actual", "Actual"],
  ["gap", "Gap"],
] as const satisfies readonly (readonly [keyof GapStatementPayload, string])[];

export function renderGapStatementToA3(payload: GapStatementPayload, entry: A3EntrySummary): A3BlockContent {
  const fieldLines: A3TextLine[] = FIELD_ORDER.filter(([key]) => payload[key].trim().length > 0).map(
    ([key, label]) => ({ text: `${label}: ${payload[key]}` }),
  );

  return {
    lines: [{ text: entry.title, bold: true }, ...fieldLines],
  };
}
