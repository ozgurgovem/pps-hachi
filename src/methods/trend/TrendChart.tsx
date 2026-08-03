import { CartesianGrid, Line, LineChart, ReferenceDot, ReferenceLine, XAxis, YAxis } from "recharts";
import type { A3ImageSize } from "../../a3/methodContract";
import type { TrendChartSpec } from "../chartSpec";

/**
 * SPEC.md §1.3: trend/run chart with a target line and event markers.
 * Rendered once here, off-screen by `src/a3/render/rasterize.ts` for the A3
 * export — see DECISIONS.md D-102. Explicit pixel dimensions and disabled
 * series animation are both load-bearing for a correct capture; see
 * `ParetoChart.tsx` for why.
 */
export function TrendChart({ spec, size }: { spec: TrendChartSpec; size: A3ImageSize }) {
  const eventPoints = spec.events
    ?.map((event) => {
      const point = spec.points.find((p) => p.label === event.at);
      return point ? { ...point, eventLabel: event.label } : undefined;
    })
    .filter((point) => point !== undefined);

  return (
    <LineChart
      width={size.widthPx}
      height={size.heightPx}
      data={[...spec.points]}
      margin={{ top: 8, right: 24, bottom: 8, left: 8 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="label" />
      <YAxis />
      <Line
        type="monotone"
        dataKey="value"
        stroke="#5F4470"
        strokeWidth={2}
        name={spec.unit ?? "value"}
        dot
        isAnimationActive={false}
      />
      {spec.targetValue !== undefined && (
        <ReferenceLine
          y={spec.targetValue}
          stroke="#A6303F"
          strokeDasharray="4 4"
          label={spec.targetLabel ?? ""}
        />
      )}
      {eventPoints?.map((point) => (
        <ReferenceDot
          key={point.eventLabel}
          x={point.label}
          y={point.value}
          r={5}
          fill="#A6303F"
          stroke="none"
          label={{ value: point.eventLabel, position: "top" }}
        />
      ))}
    </LineChart>
  );
}
