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
  /**
   * D-231/P-66: the content language (`project.meta.language`, resolved via
   * `resolveA3Language`) — NOT the UI's active i18next language, which
   * would repeat the exact P-42 mis-source bug in a rasterized export
   * component. Drives `computeHistogramBins`'s bin-range decimal separator
   * (`,` for `tr`, `.` for `en`) via `Intl.NumberFormat`. Defaults to `"en"`
   * when omitted, matching `resolveA3Language`'s own default.
   */
  readonly language?: "tr" | "en";
}

export interface ScatterChartSpec {
  readonly kind: "scatter";
  readonly xLabel?: string;
  readonly yLabel?: string;
  readonly points: readonly { readonly x: number; readonly y: number }[];
}

export interface BoxPlotChartSpec {
  readonly kind: "box-plot";
  /**
   * D-188/P-26: unlike `HistogramChartSpec.unit`/`ScatterChartSpec.{x,y}Label`
   * (Tooltip/Legend-only props, never rendered without one), this drives the
   * box plot's single `<XAxis dataKey="name">` tick — genuinely visible on
   * the exported chart — so `renderToA3` always resolves it to a real,
   * language-appropriate string rather than leaving the chart component to
   * invent an English fallback.
   */
  readonly unit: string;
  readonly values: readonly number[];
}

/**
 * Oturum C3 (DECISIONS.md D-167/D-177/P-36): ADIM 7's bullet-graph KPI strip
 * — one tile per metric, `baseline`/`target`/`actual` driving the bar's
 * dashed/solid ticks and colour fill. `status` is **user-selected, never
 * computed** — recorded as C3's own open-question answer (§2.2 of
 * `docs/oturumlar/C3-kpi-strip.md`): the codebase's existing status
 * vocabularies (`countermeasure`, `costApproval`, `icaPcaTransition`,
 * `implementationIssuesLog` — P-37/D-180) are all manually assigned too,
 * and a "higher/lower is better" direction field was never part of D-167's
 * design. `sustain`/`result` are P-36's own fix, embedded in this shape's
 * first version rather than patched on later — both are real columns in
 * Rev00 §12.4 and the signed EK-2905 document that the drafted shape
 * (`{ label, baseline, target, actual, unit }[]`) was missing.
 */
export interface KpiStripItem {
  readonly label: string;
  readonly unit?: string;
  readonly baseline: number;
  readonly target: number;
  readonly actual: number;
  readonly sustain?: number;
  readonly result?: number;
  readonly status: "onTarget" | "inProgress" | "behind";
}

export interface KpiStripChartSpec {
  readonly kind: "kpi-strip";
  readonly items: readonly KpiStripItem[];
  /** D-188/P-26: the footer legend's sustain/result labels, resolved by `renderToA3` — the chart component stays language-agnostic, same as every other spec-driven string. */
  readonly sustainLabel: string;
  readonly resultLabel: string;
  /**
   * P-63 fix: the entry's own title, rendered as the chart's own header line
   * rather than as a separate `A3BlockContent.lines` entry. Before this, the
   * block requested 1 title row + `image.rowSpan` (6) = 7 rows against
   * `pps-8step-auto`'s exactly-6-row ADIM 7 canvas — every `kpi-strip` entry
   * unconditionally overflowed to an appendix. `smartTarget`/`fiveN1K` both
   * already drop the top-level `lines` array for their own zoned strips, but
   * neither of their charts needed to swallow the title: `smartTarget` keeps
   * it inside its own Zone A `lines`, and `fiveN1K`'s reference image has no
   * heading at all. `KpiStripChart` renders no item labels resembling a
   * title, so copying that pattern blindly would have silently dropped the
   * entry's title from the exported sheet — moving it into the chart itself
   * (`KpiStripChart.tsx`'s own header band) is what keeps it visible.
   */
  readonly title: string;
  /**
   * D-232/P-67: the content language, same posture as `HistogramChartSpec.language`
   * above — drives each tile's numeric value label (`formatValue` in
   * `KpiStripChart.tsx`) via `Intl.NumberFormat`, never the UI's active
   * i18next language. Defaults to `"en"` when omitted.
   */
  readonly language?: "tr" | "en";
}

/**
 * P-27: the impact/effort matrix's real 2×2 scatter — Barış's own choice
 * (2026-09-15, `docs/oturumlar/P27-impact-effort-drag-drop.md`'s §1 question 4)
 * over the launch prompt's own recommendation of a text-list-only export.
 * A dedicated spec rather than reusing the generic `ScatterChartSpec` above:
 * that shape carries no per-point quadrant, and this chart needs one to
 * colour each dot consistently with `quadrant.ts`'s own `QUADRANT_COLORS`
 * (D-165/P-37's already-approved green/blue/red status tones, reused here
 * rather than redefined — the same posture `kpiStrip/KpiStripChart.tsx`'s own
 * `STATUS_FILL_COLOR` comment documents). `impact`/`effort` are the item's
 * real 1–5 scores (never the coarse drag-drop representative value the
 * editor's canvas writes back — see `ImpactEffortCanvas.tsx`'s own comment on
 * why only the landed quadrant, not the exact score, is load-bearing there),
 * so the exported chart keeps whatever fidelity a manually-typed score had.
 */
export interface ImpactEffortChartItem {
  readonly label: string;
  readonly impact: number;
  readonly effort: number;
  readonly quadrant: "quick-win" | "major-project" | "fill-in" | "thankless-task";
}

export interface ImpactEffortChartSpec {
  readonly kind: "impact-effort";
  readonly items: readonly ImpactEffortChartItem[];
  /** D-188/P-26: resolved by `renderToA3` from the entry's own `A3Language` — the chart component stays language-agnostic, same posture as `KpiStripChartSpec.sustainLabel`/`resultLabel`. */
  readonly xLabel: string;
  readonly yLabel: string;
}

/**
 * P-22/D-270: `action-item`'s block-level Gantt — Barış's own choice
 * (2026-09-15, `docs/oturumlar/P22-action-plan-gantt.md`) of a genuine
 * cross-entry aggregation (Seçenek B) over a single-entry mini-strip or
 * dropping the chart entirely. Unlike every other spec in this file, this
 * one is built from MULTIPLE entries at once (`A3BlockAggregateImage`,
 * `src/a3/methodContract.ts`) — one bar per `action-item` entry that
 * survived placement in its block, scaled to a shared `startDate`→`dueDate`
 * timeline. `startDate`/`dueDate` stay plain strings (the raw
 * `type: "date"` field values, `yyyy-mm-dd` when set) — `GanttChart.tsx`
 * parses them defensively and simply omits a bar it can't parse, the same
 * "skip, don't guess" posture the AI prompt library already applies to a
 * missing/malformed value.
 */
export interface GanttChartItem {
  readonly id: string;
  readonly label: string;
  readonly startDate: string;
  readonly dueDate: string;
}

export interface GanttChartSpec {
  readonly kind: "gantt-chart";
  readonly items: readonly GanttChartItem[];
}

/**
 * BVVL round, ADIM 1 (2026-09-16/17, `gapStatement`): a real two-bar
 * comparison — Barış's own reference is the EK-2905 workbook's own
 * `chart1.xml` (title "GAP ANALİZİ", categories "Mevcut Durum (date)" /
 * "İdeal Durum (date)"), reversing D-162/D-224's earlier "no numeric
 * fields, no fabricated chart" call now that Barış has explicitly asked
 * for the real chart. `bandTexts` are the three already-localized,
 * already-assembled Layer A band lines (İdeal Durum / Mevcut Durum /
 * Problem Tanımı) — `GapAnalysisChart.tsx` only draws them, all locale/
 * label logic stays in `renderToA3.ts` per this codebase's usual split.
 */
export interface GapAnalysisChartSpec {
  readonly kind: "gap-analysis";
  readonly title: string;
  readonly unit: string;
  readonly actualValue: number;
  readonly idealValue: number;
  readonly actualBarLabel: string;
  readonly idealBarLabel: string;
  readonly actualDate: string;
  readonly idealDate: string;
  readonly deviationLabel: string;
  readonly bandTexts: readonly [string, string, string];
}

/**
 * BVVL round, ADIM 1 (2026-09-17, `fiveN1K`): one item per 5N1K question,
 * in `FIELD_ORDER`'s own order. Round 9: `color` now carries a real
 * Farplas corporate design handoff's own two-brand-color ladder (see
 * `renderToA3.ts`'s own note) rather than D-165's Layer B hues — the field
 * itself is unchanged, only which hex values `renderToA3.ts` assigns to it.
 */
export interface FiveN1KDiagramItem {
  readonly label: string;
  readonly answer: string;
  readonly color: string;
}

export interface FiveN1KDiagramSpec {
  readonly kind: "five-n1k";
  readonly hubLabel: string;
  readonly items: readonly FiveN1KDiagramItem[];
}

export type ChartSpec =
  | ParetoChartSpec
  | TrendChartSpec
  | TrajectoryChartSpec
  | HistogramChartSpec
  | ScatterChartSpec
  | BoxPlotChartSpec
  | KpiStripChartSpec
  | ImpactEffortChartSpec
  | GanttChartSpec
  | GapAnalysisChartSpec
  | FiveN1KDiagramSpec;
