import type { CauseEffectInput, CauseEffectOutput } from "./schema";

/**
 * Parses one recorded cell. A blank or non-numeric cell contributes nothing
 * rather than zero-by-accident — an unscored input must not out-rank a
 * genuinely low-scored one by virtue of having been left empty, and neither
 * should a typo silently become a number.
 */
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

/** Σ (output weight × input score), over the outputs that still exist and are actually scored. */
export function weightedTotal(input: CauseEffectInput, outputs: readonly CauseEffectOutput[]): number {
  return outputs.reduce((total, output) => {
    const weight = scoreValue(output.weight);
    const score = scoreValue(input.scores[output.id]);
    if (weight === undefined || score === undefined) {
      return total;
    }
    return total + weight * score;
  }, 0);
}

/** Highest weighted total first — the ranking that makes the matrix worth filling in. */
export function rankInputs(
  inputs: readonly CauseEffectInput[],
  outputs: readonly CauseEffectOutput[],
): readonly { readonly input: CauseEffectInput; readonly total: number }[] {
  return inputs
    .map((input) => ({ input, total: weightedTotal(input, outputs) }))
    .sort((a, b) => b.total - a.total);
}
