import type { A3BlockContent, A3EntrySummary, A3TextLine } from "../../a3/methodContract";
import { rankInputs, scoreValue } from "./score";
import type { CauseEffectMatrixPayload } from "./schema";

/**
 * Ranked, not tabular: the A3 block is a few printed lines wide, and the
 * decision the matrix exists to support is "which inputs matter most" — not
 * "what did every cell say". The full grid stays in the app.
 */
export function renderCauseEffectMatrixToA3(
  payload: CauseEffectMatrixPayload,
  entry: A3EntrySummary,
): A3BlockContent {
  const outputSummary = payload.outputs
    .filter((output) => output.name.trim().length > 0)
    .map((output) => {
      const weight = scoreValue(output.weight);
      return weight === undefined ? output.name.trim() : `${output.name.trim()} (${weight})`;
    });

  const outputLine: A3TextLine[] =
    outputSummary.length > 0 ? [{ text: `Outputs: ${outputSummary.join(" · ")}` }] : [];

  const rankedLines: A3TextLine[] = rankInputs(payload.inputs, payload.outputs)
    .filter(({ input }) => input.name.trim().length > 0)
    .map(({ input, total }) => ({ text: `${input.name.trim()} — ${total}` }));

  return {
    lines: [{ text: entry.title, bold: true }, ...outputLine, ...rankedLines],
  };
}
