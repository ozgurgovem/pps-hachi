import { Bar, BarChart, CartesianGrid, ReferenceLine, Scatter, ScatterChart, XAxis, YAxis, ZAxis } from "recharts";
import type { A3ImageSize } from "../../a3/methodContract";
import type { BoxPlotChartSpec, HistogramChartSpec, ScatterChartSpec } from "../chartSpec";
import { computeBoxPlotStats, computeHistogramBins } from "./stats";

/**
 * SPEC.md §1.3: histogram / scatter / box plot, one component dispatching
 * on `spec.kind` — see `chartSpec.ts`'s Phase 6c comment for why this is
 * one `A3ImageKind` rather than three. Explicit pixel dimensions and
 * disabled series animation are load-bearing for a correct off-screen
 * capture, same reasons as `ParetoChart.tsx`.
 */
export function DistributionChart({
  spec,
  size,
}: {
  spec: HistogramChartSpec | ScatterChartSpec | BoxPlotChartSpec;
  size: A3ImageSize;
}) {
  if (spec.kind === "histogram") {
    return <HistogramView spec={spec} size={size} />;
  }
  if (spec.kind === "scatter") {
    return <ScatterView spec={spec} size={size} />;
  }
  return <BoxPlotView spec={spec} size={size} />;
}

function HistogramView({ spec, size }: { spec: HistogramChartSpec; size: A3ImageSize }) {
  const bins = computeHistogramBins(spec.values, spec.binCount, spec.language ?? "en");
  return (
    <BarChart width={size.widthPx} height={size.heightPx} data={[...bins]} margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="rangeLabel" />
      <YAxis allowDecimals={false} />
      <Bar dataKey="count" fill="#5F4470" name={spec.unit ?? "count"} isAnimationActive={false} />
    </BarChart>
  );
}

function ScatterView({ spec, size }: { spec: ScatterChartSpec; size: A3ImageSize }) {
  return (
    <ScatterChart width={size.widthPx} height={size.heightPx} margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis type="number" dataKey="x" name={spec.xLabel ?? "x"} />
      <YAxis type="number" dataKey="y" name={spec.yLabel ?? "y"} />
      <ZAxis range={[60, 60]} />
      <Scatter data={[...spec.points]} fill="#5F4470" isAnimationActive={false} />
    </ScatterChart>
  );
}

function BoxPlotView({ spec, size }: { spec: BoxPlotChartSpec; size: A3ImageSize }) {
  const stats = computeBoxPlotStats(spec.values);
  if (!stats) {
    return <BarChart width={size.widthPx} height={size.heightPx} data={[]} />;
  }
  const data = [{ name: spec.unit, belowBox: stats.q1, box: stats.q3 - stats.q1 }];
  return (
    <BarChart width={size.widthPx} height={size.heightPx} data={data} margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis domain={[stats.min, stats.max]} />
      <Bar dataKey="belowBox" stackId="box" fill="transparent" isAnimationActive={false} />
      <Bar dataKey="box" stackId="box" fill="#5F4470" isAnimationActive={false} />
      <ReferenceLine y={stats.median} stroke="#A6303F" strokeWidth={2} />
      <ReferenceLine y={stats.min} stroke="#3A3A3A" strokeDasharray="4 4" />
      <ReferenceLine y={stats.max} stroke="#3A3A3A" strokeDasharray="4 4" />
    </BarChart>
  );
}
