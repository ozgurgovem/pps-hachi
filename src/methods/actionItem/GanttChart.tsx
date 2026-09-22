import type { A3ImageSize } from "../../a3/methodContract";
import type { GanttChartSpec } from "../chartSpec";
import { readableFontPx } from "../../a3/readability";

/**
 * P-22/D-270: hand-rolled SVG, not a Recharts composition — same reasoning
 * as `KpiStripChart.tsx` (D-177): a shared-timeline bar-per-item strip has
 * no direct Recharts primitive, and an explicit `viewBox` sidesteps the
 * `ResponsiveContainer` capture hazard (D-105/D-113) entirely, there is no
 * measurement step to miss. `BAR_COLOR` is drawn from the app's own steel
 * palette rather than either of D-165's Layer A/Layer B semantic hues — a
 * Gantt bar is a schedule, not a status, the same "third register" choice
 * Oturum B3 (D-174) already made for Pareto's own bars.
 */
const BAR_COLOR = "#3B6E91";
const TRACK_COLOR = "#E5E5E5";
const LABEL_COLOR = "#1A1A1A";

const LABEL_MAX_CHARS = 22;
const MIN_BAR_WIDTH_PX = 3;

function truncate(text: string, maxChars: number): string {
  return text.length > maxChars ? `${text.slice(0, maxChars - 1)}…` : text;
}

/** `startDate`/`dueDate` are free-typed `z.string()` fields (D-51) — undefined for blank or unparseable, never thrown. */
function parseDateMs(value: string): number | undefined {
  if (!value.trim()) {
    return undefined;
  }
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? undefined : ms;
}

export function GanttChart({ spec, size }: { spec: GanttChartSpec; size: A3ImageSize }) {
  const items = spec.items;
  const count = Math.max(1, items.length);

  const parsed = items.map((item) => ({
    item,
    start: parseDateMs(item.startDate),
    due: parseDateMs(item.dueDate),
  }));

  const knownDates = parsed.flatMap(({ start, due }) => [start, due]).filter((ms): ms is number => ms !== undefined);
  const timelineMin = knownDates.length > 0 ? Math.min(...knownDates) : 0;
  const timelineMaxRaw = knownDates.length > 0 ? Math.max(...knownDates) : 1;
  const timelineMax = timelineMaxRaw > timelineMin ? timelineMaxRaw : timelineMin + 1;
  const timelineSpan = timelineMax - timelineMin;

  const labelWidth = Math.min(size.widthPx * 0.32, 150);
  const trackLeft = labelWidth + 8;
  const trackWidth = Math.max(1, size.widthPx - trackLeft - 4);
  const rowHeight = size.heightPx / count;
  const barHeight = Math.max(3, rowHeight * 0.45);
  // Okunabilirlik tabanı (readability.ts): a bar label may grow with its row but never shrink under the printed 10pt floor.
  const labelFontSize = readableFontPx(Math.min(11, rowHeight * 0.4));

  const scaleX = (ms: number) => trackLeft + ((ms - timelineMin) / timelineSpan) * trackWidth;

  return (
    <svg width={size.widthPx} height={size.heightPx} viewBox={`0 0 ${size.widthPx} ${size.heightPx}`}>
      <rect x={0} y={0} width={size.widthPx} height={size.heightPx} fill="#FFFFFF" />
      {parsed.map(({ item, start, due }, index) => {
        const rowTop = index * rowHeight;
        const barTop = rowTop + (rowHeight - barHeight) / 2;
        const hasAnyDate = start !== undefined || due !== undefined;
        const barStartX = start !== undefined ? scaleX(start) : trackLeft;
        const barEndX = due !== undefined ? scaleX(due) : barStartX;
        const barLeft = Math.min(barStartX, barEndX);
        const barWidth = Math.max(MIN_BAR_WIDTH_PX, Math.abs(barEndX - barStartX));

        return (
          <g key={item.id}>
            <text
              x={0}
              y={rowTop + rowHeight / 2 + labelFontSize * 0.35}
              fontSize={labelFontSize}
              fill={LABEL_COLOR}
            >
              {truncate(item.label, LABEL_MAX_CHARS)}
            </text>
            <rect x={trackLeft} y={barTop} width={trackWidth} height={barHeight} fill={TRACK_COLOR} />
            {hasAnyDate && <rect x={barLeft} y={barTop} width={barWidth} height={barHeight} fill={BAR_COLOR} rx={2} />}
          </g>
        );
      })}
    </svg>
  );
}
