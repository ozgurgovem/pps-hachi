import type { A3BlockContent, A3EntrySummary, A3Language, A3TextLine } from "../../a3/methodContract";
import { resolveA3Language } from "../../a3/methodContract";
import { rankInputs, scoreValue } from "./score";
import type { CauseEffectMatrixPayload } from "./schema";

/** D-188/P-26: abbreviated the same way the existing "Outputs" export prefix is. */
const OUTPUTS_PREFIX: Readonly<Record<A3Language, string>> = { tr: "Çıktılar", en: "Outputs" };

/**
 * Ranked, not tabular: the A3 block is a few printed lines wide, and the
 * decision the matrix exists to support is "which inputs matter most" — not
 * "what did every cell say". The full grid stays in the app.
 */
export function renderCauseEffectMatrixToA3(
  payload: CauseEffectMatrixPayload,
  entry: A3EntrySummary,
): A3BlockContent {
  const language = resolveA3Language(entry);
  const outputSummary = payload.outputs
    .filter((output) => output.name.trim().length > 0)
    .map((output) => {
      const weight = scoreValue(output.weight);
      return weight === undefined ? output.name.trim() : `${output.name.trim()} (${weight})`;
    });

  const outputLine: A3TextLine[] =
    outputSummary.length > 0 ? [{ text: `${OUTPUTS_PREFIX[language]}: ${outputSummary.join(" · ")}` }] : [];

  const rankedLines: A3TextLine[] = rankInputs(payload.inputs, payload.outputs)
    .filter(({ input }) => input.name.trim().length > 0)
    .map(({ input, total }) => ({ text: `${input.name.trim()} — ${total}` }));

  return {
    lines: [{ text: entry.title, bold: true }, ...outputLine, ...rankedLines],
  };
}
