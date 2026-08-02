import type { A3BlockContent, A3EntrySummary } from "../../a3/methodContract";
import type { GenericTextPayload } from "./schema";

export function renderGenericTextToA3(
  payload: GenericTextPayload,
  entry: A3EntrySummary,
): A3BlockContent {
  const bodyLines = payload.text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return {
    lines: [{ text: entry.title, bold: true }, ...bodyLines.map((text) => ({ text }))],
  };
}
