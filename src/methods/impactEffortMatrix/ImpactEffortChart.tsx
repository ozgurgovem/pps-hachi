import { CartesianGrid, ReferenceLine, Scatter, ScatterChart, XAxis, YAxis, ZAxis } from "recharts";
import type { A3ImageSize } from "../../a3/methodContract";
import type { ImpactEffortChartSpec } from "../chartSpec";
import { QUADRANT_COLORS, type Quadrant } from "./quadrant";

/**
 * P-27: `quadrantOf`'s own split — impact ≥3 is high, effort ≤2 is low — puts
 * the boundary at 2.5 on a 1–5 scale either way (a score of exactly 3 always
 * falls on the "high" side of the split). Drawing the reference lines at 2.5
 * rather than 3 keeps the chart's visual boundary unambiguous with that
 * asymmetric rule, instead of sitting a boundary-value dot directly on a line.
 */
const MIDPOINT = 2.5;
const AXIS_DOMAIN: readonly [number, number] = [0.5, 5.5];
const AXIS_TICKS = [1, 2, 3, 4, 5];

const QUADRANTS: readonly Quadrant[] = ["quick-win", "major-project", "fill-in", "thankless-task"];

/**
 * P-27's approved export visual: a real 2×2 scatter, one `<Scatter>` series
 * per quadrant so each dot takes its quadrant's own colour
 * (`QUADRANT_COLORS`) without a custom per-point `Cell` renderer. Explicit
 * pixel dimensions and disabled series animation are load-bearing for a
 * correct off-screen capture, same reasons as `ParetoChart.tsx`/D-102.
 */
export function ImpactEffortChart({ spec, size }: { spec: ImpactEffortChartSpec; size: A3ImageSize }) {
  return (
    <ScatterChart width={size.widthPx} height={size.heightPx} margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis
        type="number"
        dataKey="effort"
        domain={AXIS_DOMAIN}
        ticks={AXIS_TICKS}
        label={{ value: spec.xLabel, position: "insideBottom", offset: -16 }}
      />
      <YAxis
        type="number"
        dataKey="impact"
        domain={AXIS_DOMAIN}
        ticks={AXIS_TICKS}
        label={{ value: spec.yLabel, angle: -90, position: "insideLeft" }}
      />
      <ZAxis range={[90, 90]} />
      <ReferenceLine x={MIDPOINT} stroke="#8A8A8A" strokeDasharray="4 4" />
      <ReferenceLine y={MIDPOINT} stroke="#8A8A8A" strokeDasharray="4 4" />
      {QUADRANTS.map((quadrant) => (
        <Scatter
          key={quadrant}
          data={spec.items.filter((item) => item.quadrant === quadrant)}
          fill={QUADRANT_COLORS[quadrant]}
          isAnimationActive={false}
        />
      ))}
    </ScatterChart>
  );
}
