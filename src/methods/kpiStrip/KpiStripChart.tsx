import type { A3ImageSize } from "../../a3/methodContract";
import type { KpiStripChartSpec, KpiStripItem } from "../chartSpec";

/**
 * D-177's approved visual: a horizontal strip of bullet-graph tiles, one
 * per KPI item — a dashed grey Önce/baseline tick, a solid black
 * Hedef/target tick+triangle, and a single Layer A colour-coded fill for
 * Sonra/actual (D-165's palette — reused hex values, never redefined).
 * Built as raw SVG rather than a Recharts composition: a bullet graph's
 * ticks/triangle marker have no direct Recharts primitive, and an SVG with
 * an explicit `viewBox` sidesteps the `ResponsiveContainer` hazard
 * (D-105/D-113) entirely — there is no measurement step to miss.
 */
const STATUS_FILL_COLOR: Readonly<Record<KpiStripItem["status"], string>> = {
  onTarget: "#8FBF4F",
  inProgress: "#4A90D9",
  behind: "#E0342A",
};

const TRACK_COLOR = "#E5E5E5";
const BASELINE_COLOR = "#8A8A8A";
const TARGET_COLOR = "#1A1A1A";
const LABEL_COLOR = "#1A1A1A";
const FOOTER_COLOR = "#4D4D4D";

function formatValue(value: number, unit: string | undefined): string {
  const rounded = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return unit ? `${rounded} ${unit}` : rounded;
}

interface TileProps {
  readonly item: KpiStripItem;
  readonly x: number;
  readonly width: number;
  readonly height: number;
  readonly sustainLabel: string;
  readonly resultLabel: string;
}

function Tile({ item, x, width, height, sustainLabel, resultLabel }: TileProps) {
  const padding = Math.max(4, width * 0.06);
  const hasFooter = item.sustain !== undefined || item.result !== undefined;
  const labelHeight = height * (hasFooter ? 0.26 : 0.3);
  const footerHeight = hasFooter ? height * 0.2 : 0;
  const barTop = labelHeight + padding;
  const barHeight = Math.max(8, height - labelHeight - footerHeight - padding * 2);
  const barLeft = x + padding;
  const barWidth = Math.max(1, width - padding * 2);

  const domainMin = Math.min(0, item.baseline, item.target, item.actual);
  const domainMax = Math.max(domainMin + 1, item.baseline, item.target, item.actual) * 1.15;
  const span = domainMax - domainMin;
  const scaleX = (value: number) => barLeft + ((value - domainMin) / span) * barWidth;

  const zeroX = scaleX(Math.max(domainMin, 0));
  const actualX = scaleX(item.actual);
  const fillLeft = Math.min(zeroX, actualX);
  const fillWidth = Math.max(0, Math.abs(actualX - zeroX));

  const baselineX = scaleX(item.baseline);
  const targetX = scaleX(item.target);
  const triangleSize = Math.max(4, barHeight * 0.3);
  const triangleTop = barTop - 2 - triangleSize;

  const labelFontSize = Math.max(10, labelHeight * 0.5);
  const footerFontSize = Math.max(9, footerHeight * 0.55);

  return (
    <g>
      <text x={x + padding} y={labelFontSize + 2} fontWeight={700} fontSize={labelFontSize} fill={LABEL_COLOR}>
        {item.label}
      </text>
      <text
        x={x + width - padding}
        y={labelFontSize + 2}
        fontSize={labelFontSize}
        fill={STATUS_FILL_COLOR[item.status]}
        textAnchor="end"
      >
        {formatValue(item.actual, item.unit)}
      </text>

      <rect x={barLeft} y={barTop} width={barWidth} height={barHeight} fill={TRACK_COLOR} />
      <rect x={fillLeft} y={barTop} width={fillWidth} height={barHeight} fill={STATUS_FILL_COLOR[item.status]} />
      <line
        x1={baselineX}
        y1={barTop - 2}
        x2={baselineX}
        y2={barTop + barHeight + 2}
        stroke={BASELINE_COLOR}
        strokeWidth={2}
        strokeDasharray="3 2"
      />
      <line x1={targetX} y1={barTop - 2} x2={targetX} y2={barTop + barHeight + 2} stroke={TARGET_COLOR} strokeWidth={2} />
      <polygon
        points={`${targetX - triangleSize / 2},${barTop - 2} ${targetX + triangleSize / 2},${barTop - 2} ${targetX},${triangleTop}`}
        fill={TARGET_COLOR}
      />

      {hasFooter && (
        <text x={x + padding} y={height - footerFontSize * 0.4} fontSize={footerFontSize} fill={FOOTER_COLOR}>
          {[
            item.sustain !== undefined ? `${sustainLabel}: ${formatValue(item.sustain, item.unit)}` : undefined,
            item.result !== undefined ? `${resultLabel}: ${formatValue(item.result, item.unit)}` : undefined,
          ]
            .filter((part): part is string => part !== undefined)
            .join("   ·   ")}
        </text>
      )}
    </g>
  );
}

/** P-63: the entry's own title used to be a separate `A3BlockContent.lines` row spent on top of this chart's fixed row-span — one row too many for `pps-8step-auto`'s exactly-6-row ADIM 7 canvas. Rendering it as this chart's own header band instead keeps the title visible while costing zero extra rows outside the chart's own budget. */
const TITLE_HEIGHT_FRACTION = 0.14;
const MIN_TITLE_HEIGHT_PX = 14;

export function KpiStripChart({ spec, size }: { spec: KpiStripChartSpec; size: A3ImageSize }) {
  const count = Math.max(1, spec.items.length);
  const tileWidth = size.widthPx / count;
  const titleHeight = Math.max(MIN_TITLE_HEIGHT_PX, size.heightPx * TITLE_HEIGHT_FRACTION);
  const tilesHeight = Math.max(1, size.heightPx - titleHeight);
  const titleFontSize = Math.max(9, titleHeight * 0.6);

  return (
    <svg width={size.widthPx} height={size.heightPx} viewBox={`0 0 ${size.widthPx} ${size.heightPx}`}>
      <rect x={0} y={0} width={size.widthPx} height={size.heightPx} fill="#FFFFFF" />
      <text x={0} y={titleFontSize} fontWeight={700} fontSize={titleFontSize} fill={LABEL_COLOR}>
        {spec.title}
      </text>
      <g transform={`translate(0, ${titleHeight})`}>
        {spec.items.map((item, index) => (
          <Tile
            key={`${item.label}-${index}`}
            item={item}
            x={index * tileWidth}
            width={tileWidth}
            height={tilesHeight}
            sustainLabel={spec.sustainLabel}
            resultLabel={spec.resultLabel}
          />
        ))}
      </g>
    </svg>
  );
}
