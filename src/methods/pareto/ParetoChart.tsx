import { Bar, CartesianGrid, ComposedChart, Line, ReferenceLine, XAxis, YAxis } from "recharts";
import type { A3ImageSize } from "../../a3/methodContract";
import type { ParetoChartSpec } from "../chartSpec";

const DEFAULT_CUTOFF_PERCENT = 80;

interface ParetoDatum {
  readonly label: string;
  readonly count: number;
  readonly cumulativePercent: number;
}

function toDescendingCumulative(spec: ParetoChartSpec): readonly ParetoDatum[] {
  const sorted = [...spec.items].sort((a, b) => b.count - a.count);
  const total = sorted.reduce((sum, item) => sum + item.count, 0);
  let running = 0;
  return sorted.map((item) => {
    running += item.count;
    return {
      label: item.label,
      count: item.count,
      cumulativePercent: total === 0 ? 0 : (running / total) * 100,
    };
  });
}

/**
 * SPEC.md §1.3: Pareto chart with cumulative % line and 80% cut. Rendered
 * once here, off-screen by `src/a3/render/rasterize.ts` for the A3 export —
 * see DECISIONS.md D-102. Takes explicit pixel dimensions rather than
 * `ResponsiveContainer`: the rasterizer already knows the exact box, and a
 * measurement-driven container renders nothing until a ResizeObserver cycle
 * completes, which would export as a blank PNG.
 */
export function ParetoChart({ spec, size }: { spec: ParetoChartSpec; size: A3ImageSize }) {
  const data = toDescendingCumulative(spec);
  const cutoff = spec.cutoffPercent ?? DEFAULT_CUTOFF_PERCENT;

  return (
    <ComposedChart
      width={size.widthPx}
      height={size.heightPx}
      data={data}
      margin={{ top: 8, right: 24, bottom: 8, left: 8 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="label" />
      <YAxis yAxisId="count" />
      <YAxis yAxisId="percent" orientation="right" domain={[0, 100]} />
      {/* `isAnimationActive={false}` on every series is load-bearing, not cosmetic:
          Recharts animates from zero on mount, so a capture taken before the
          animation finishes would export bars/lines at the wrong values. */}
      <Bar
        yAxisId="count"
        dataKey="count"
        fill="#5F4470"
        name={spec.unit ?? "count"}
        isAnimationActive={false}
      />
      <Line
        yAxisId="percent"
        type="monotone"
        dataKey="cumulativePercent"
        stroke="#A6303F"
        strokeWidth={2}
        dot
        isAnimationActive={false}
      />
      <ReferenceLine yAxisId="percent" y={cutoff} stroke="#A6303F" strokeDasharray="4 4" />
    </ComposedChart>
  );
}
