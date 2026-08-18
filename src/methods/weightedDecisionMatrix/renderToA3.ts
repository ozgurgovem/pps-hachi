import type { A3BlockContent, A3EntrySummary, A3Language, A3TextLine } from "../../a3/methodContract";
import { resolveA3Language } from "../../a3/methodContract";
import { rankOptions, scoreValue } from "./score";
import type { WeightedDecisionMatrixPayload } from "./schema";

/** D-188/P-26: abbreviated the same way the existing "Criteria" export prefix is. */
const CRITERIA_PREFIX: Readonly<Record<A3Language, string>> = { tr: "Kriterler", en: "Criteria" };

/** Ranked, not tabular — same reasoning as `causeEffectMatrix/renderToA3.ts`. */
export function renderWeightedDecisionMatrixToA3(
  payload: WeightedDecisionMatrixPayload,
  entry: A3EntrySummary,
): A3BlockContent {
  const language = resolveA3Language(entry);
  const criteriaSummary = payload.criteria
    .filter((criterion) => criterion.name.trim().length > 0)
    .map((criterion) => {
      const weight = scoreValue(criterion.weight);
      return weight === undefined ? criterion.name.trim() : `${criterion.name.trim()} (${weight})`;
    });

  const criteriaLine: A3TextLine[] =
    criteriaSummary.length > 0 ? [{ text: `${CRITERIA_PREFIX[language]}: ${criteriaSummary.join(" · ")}` }] : [];

  const rankedLines: A3TextLine[] = rankOptions(payload.options, payload.criteria)
    .filter(({ option }) => option.name.trim().length > 0)
    .map(({ option, total }) => ({ text: `${option.name.trim()} — ${total}` }));

  return {
    lines: [{ text: entry.title, bold: true }, ...criteriaLine, ...rankedLines],
  };
}
