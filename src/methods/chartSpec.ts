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

/**
 * Phase 6c: the one new mechanism this slice adds (D-114/P-22 — the action
 * plan Gantt is a *second*, unrelated new mechanism and was deliberately
 * deferred to its own slice rather than bundled in here). All three of
 * SPEC.md §1.3's "Histogram / scatter / box plot" bullet share one
 * `A3ImageKind` (`distribution-chart`) and one method (`distributionChart`)
 * — the user picks `chartType`, `DistributionChart.tsx` dispatches on
 * `spec.kind` the same way `ChartSpec` already discriminates Pareto/Trend/
 * Trajectory. Raw values stay `string`-typed in the payload per D-120;
 * binning/quartile math is computed at render time
 * (`distributionChart/stats.ts`), same derive-don't-store posture as
 * `causeEffectMatrix/score.ts`.
 */
export interface HistogramChartSpec {
  readonly kind: "histogram";
  readonly unit?: string;
  readonly values: readonly number[];
  /** Defaults to Sturges' rule when omitted — see `stats.ts`. */
  readonly binCount?: number;
}

export interface ScatterChartSpec {
  readonly kind: "scatter";
  readonly xLabel?: string;
  readonly yLabel?: string;
  readonly points: readonly { readonly x: number; readonly y: number }[];
}

export interface BoxPlotChartSpec {
  readonly kind: "box-plot";
  readonly unit?: string;
  readonly values: readonly number[];
}

export type ChartSpec =
  | ParetoChartSpec
  | TrendChartSpec
  | TrajectoryChartSpec
  | HistogramChartSpec
  | ScatterChartSpec
  | BoxPlotChartSpec;
