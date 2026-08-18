import type { A3Language } from "../../a3/methodContract";
import type { ImpactEffortItem } from "./schema";

export type Quadrant = "quick-win" | "major-project" | "fill-in" | "thankless-task";

/** Same blank/non-numeric-is-unscored posture as `causeEffectMatrix/score.ts`'s `scoreValue`. */
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

/**
 * 1–5 scale, split at the midpoint (3): impact ≥3 is "high", effort ≤2 is
 * "low". Undefined when either score is missing — an unscored item has no
 * quadrant rather than defaulting into one.
 */
export function quadrantOf(item: ImpactEffortItem): Quadrant | undefined {
  const impact = scoreValue(item.impact);
  const effort = scoreValue(item.effort);
  if (impact === undefined || effort === undefined) {
    return undefined;
  }
  const highImpact = impact >= 3;
  const lowEffort = effort <= 2;
  if (highImpact && lowEffort) {
    return "quick-win";
  }
  if (highImpact && !lowEffort) {
    return "major-project";
  }
  if (!highImpact && lowEffort) {
    return "fill-in";
  }
  return "thankless-task";
}

/** A3-side labels, keyed by `A3Language` (D-188/P-26) — `renderToA3` is i18n-free (D-43). */
export const QUADRANT_EXPORT_LABELS: Readonly<Record<Quadrant, Readonly<Record<A3Language, string>>>> = {
  "quick-win": { tr: "Hızlı kazanım", en: "Quick win" },
  "major-project": { tr: "Büyük proje", en: "Major project" },
  "fill-in": { tr: "Doldurma", en: "Fill-in" },
  "thankless-task": { tr: "Nankör iş", en: "Thankless task" },
};
