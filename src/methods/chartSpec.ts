/**
 * D-102: the pure data a chart method hands to `A3BlockContent.image.spec`.
 * Lives here (not `src/a3/methodContract.ts`) because it is shared between
 * method plugins (Pareto, Trend, SMART Target) and their Recharts
 * components — `src/a3` itself only ever sees this as opaque `unknown`.
 * Mirrors SPEC.md §8.8's future AI-emitted `ChartSpec` shape on purpose, so
 * Phase 9's "the model emits specs, not pictures" has somewhere to land
 * without redesigning this.
 */

export interface ChartPoint {
  readonly label: string;
  readonly value: number;
}

export interface ParetoChartSpec {
  readonly kind: "pareto";
  readonly unit?: string;
  readonly items: readonly { readonly label: string; readonly count: number }[];
  /** Default 80 — SPEC.md §1.3's "with cumulative % line and 80% cut". */
  readonly cutoffPercent?: number;
}

export interface TrendChartSpec {
  readonly kind: "trend";
  readonly unit?: string;
  readonly points: readonly ChartPoint[];
  readonly targetValue?: number;
  readonly targetLabel?: string;
  readonly events?: readonly { readonly label: string; readonly at: string }[];
}

export interface TrajectoryChartSpec {
  readonly kind: "trajectory";
  readonly unit?: string;
  readonly baseline: ChartPoint;
  readonly target: ChartPoint;
  readonly actualPoints?: readonly ChartPoint[];
}

export type ChartSpec = ParetoChartSpec | TrendChartSpec | TrajectoryChartSpec;
