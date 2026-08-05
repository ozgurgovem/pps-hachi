import type { DecisionCriterion, DecisionOption } from "./schema";

/** Blank or non-numeric contributes nothing rather than zero — same posture as `causeEffectMatrix/score.ts`. */
export function scoreValue(raw: string | undefined): number | undefined {
  if (raw === undefined) {
    return undefined;
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Σ (criterion weight × option score), over criteria that still exist and are actually scored. */
export function weightedTotal(option: DecisionOption, criteria: readonly DecisionCriterion[]): number {
  return criteria.reduce((total, criterion) => {
    const weight = scoreValue(criterion.weight);
    const score = scoreValue(option.scores[criterion.id]);
    if (weight === undefined || score === undefined) {
      return total;
    }
    return total + weight * score;
  }, 0);
}

/** Highest weighted total first. */
export function rankOptions(
  options: readonly DecisionOption[],
  criteria: readonly DecisionCriterion[],
): readonly { readonly option: DecisionOption; readonly total: number }[] {
  return options
    .map((option) => ({ option, total: weightedTotal(option, criteria) }))
    .sort((a, b) => b.total - a.total);
}
