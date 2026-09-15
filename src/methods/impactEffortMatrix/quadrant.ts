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

/** P-27: the scatter chart's axis titles, same `A3Language`-keyed/i18n-free posture as `QUADRANT_EXPORT_LABELS` above. */
export const AXIS_EXPORT_LABELS: Readonly<Record<"impact" | "effort", Readonly<Record<A3Language, string>>>> = {
  impact: { tr: "Etki", en: "Impact" },
  effort: { tr: "Çaba", en: "Effort" },
};

/**
 * P-27: D-165/P-37's already-approved status tones (`kpiStrip/KpiStripChart.tsx`'s
 * own `STATUS_FILL_COLOR`) reused, never redefined — green for the best
 * quadrant, red for the worst, blue for "valuable but costly", and a neutral
 * grey (`kpiStrip`'s own `BASELINE_COLOR`) for the fourth, since no existing
 * three-tone status vocabulary in this codebase has a fourth "doesn't matter
 * much either way" meaning to borrow. Shared by both the interactive
 * `ImpactEffortCanvas` editor and the exported `ImpactEffortChart`, so a dot
 * never changes colour between drawing and export.
 */
export const QUADRANT_COLORS: Readonly<Record<Quadrant, string>> = {
  "quick-win": "#8FBF4F",
  "major-project": "#4A90D9",
  "fill-in": "#8A8A8A",
  "thankless-task": "#E0342A",
};
