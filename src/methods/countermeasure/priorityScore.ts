import type { CountermeasurePayload } from "./schema";

/** Same blank/non-numeric-is-unscored posture as `causeEffectMatrix/score.ts` and `impactEffortMatrix/quadrant.ts`'s `scoreValue`. */
function scoreValue(raw: string | undefined): number | undefined {
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

/**
 * Impact × cost-favorability × duration-favorability — all three 1-5, high
 * is always favorable (high impact, cheap, fast). Undefined when any of the
 * three is missing or non-numeric; never defaults a blank score to 0 or 1,
 * the same "unscored, not zero" rule D-120 already established.
 */
export function priorityScoreOf(
  payload: Pick<CountermeasurePayload, "impactScore" | "costScore" | "durationScore">,
): number | undefined {
  const impact = scoreValue(payload.impactScore);
  const cost = scoreValue(payload.costScore);
  const duration = scoreValue(payload.durationScore);
  if (impact === undefined || cost === undefined || duration === undefined) {
    return undefined;
  }
  return impact * cost * duration;
}
