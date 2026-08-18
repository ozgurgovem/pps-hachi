import type { A3BlockContent, A3EntrySummary, A3Language, A3TextLine } from "../../a3/methodContract";
import { resolveA3Language } from "../../a3/methodContract";
import { whyChainLines } from "../shared/whyChain";
import type { ThreeLeggedFiveWhyPayload } from "./schema";

/** D-188/P-26: matches `methods.threeLeggedFiveWhy.{occurrence,detection,systemic}Label`'s own editor translations. */
const LEG_LABELS = [
  ["occurrence", { tr: "Oluşum", en: "Occurrence" }],
  ["detection", { tr: "Tespit", en: "Detection" }],
  ["systemic", { tr: "Sistemik", en: "Systemic" }],
] as const satisfies readonly (readonly [keyof ThreeLeggedFiveWhyPayload, Readonly<Record<A3Language, string>>])[];

export function renderThreeLeggedFiveWhyToA3(
  payload: ThreeLeggedFiveWhyPayload,
  entry: A3EntrySummary,
): A3BlockContent {
  const language = resolveA3Language(entry);
  const problemLine = payload.problemStatement.trim().length > 0 ? [{ text: payload.problemStatement }] : [];

  const legLines: A3TextLine[] = LEG_LABELS.flatMap(([key, label]) => {
    const lines = whyChainLines(payload[key], language);
    return lines.length > 0 ? [{ text: label[language], bold: true }, ...lines] : [];
  });

  return {
    lines: [{ text: entry.title, bold: true }, ...problemLine, ...legLines],
  };
}
