import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import type { A3ImageSize } from "../../a3/methodContract";
import type { TrajectoryChartSpec } from "../chartSpec";

/**
 * D-38: Step 3's zone B — baseline→target trajectory. Rendered once here,
 * off-screen by `src/a3/render/rasterize.ts` for the A3 export (D-102).
 * Explicit pixel dimensions and disabled series animation are both
 * load-bearing for a correct capture; see `ParetoChart.tsx` for why.
 */
export function TrajectoryChart({ spec, size }: { spec: TrajectoryChartSpec; size: A3ImageSize }) {
  const data = [
    { label: spec.baseline.label, baseline: spec.baseline.value },
    ...(spec.actualPoints ?? []).map((point) => ({ label: point.label, actual: point.value })),
    { label: spec.target.label, target: spec.target.value },
  ];

  return (
    <ComposedChart
      width={size.widthPx}
      height={size.heightPx}
      data={data}
      margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="label" />
      <YAxis />
      <Bar
        dataKey="baseline"
        fill="#B8AE93"
        fillOpacity={0.8}
        name={spec.unit ?? "baseline"}
        isAnimationActive={false}
      />
      <Bar dataKey="target" fill="#5F4470" name={spec.unit ?? "target"} isAnimationActive={false} />
      <Line type="monotone" dataKey="actual" stroke="#A6303F" strokeWidth={2} dot isAnimationActive={false} />
    </ComposedChart>
  );
}
