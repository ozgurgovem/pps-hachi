import type { A3ImageSize } from "../../a3/methodContract";
import type { GapAnalysisChartSpec } from "../chartSpec";
import { layoutGapBands } from "./chartLayout";

/** D-165 Layer A, reused verbatim — never redefined here. */
const IDEAL_COLOR = "#8FBF4F";
const ACTUAL_COLOR = "#4A90D9";
const PROBLEM_COLOR = "#E0342A";
const BAND_COLORS = [IDEAL_COLOR, ACTUAL_COLOR, PROBLEM_COLOR] as const;
const BAND_TEXT_COLORS = ["#1A1A1A", "#1A1A1A", "#FFFFFF"] as const;

const PT_TO_PX = 96 / 72;
/** Real EK-2905 band box: cy=252000 EMU = 19.84pt — the three bands below the chart always share this one height, never their own individual line-count height (Barış's own correction, BVVL round 4). */
const BAND_HEIGHT_PT = 20;
const BAND_FONT_PT = 8;
const BAND_LINE_HEIGHT_PT = 10;
const BAND_HEIGHT_PX = BAND_HEIGHT_PT * PT_TO_PX;
const BAND_FONT_PX = BAND_FONT_PT * PT_TO_PX;
const BAND_LINE_HEIGHT_PX = BAND_LINE_HEIGHT_PT * PT_TO_PX;
const BAND_TEXT_PADDING_X = 10;

const COMPACT_WIDTH_PT = 170;
const CHART_MARGIN_PX = 20;

function drawBands(
  spec: GapAnalysisChartSpec,
  layout: ReturnType<typeof layoutGapBands>,
  boxX: number,
  startY: number,
) {
  let y = startY;
  return layout.wrappedBands.map((lines, index) => {
    const blockHeight = lines.length * BAND_LINE_HEIGHT_PX;
    const firstBaselineY = y + (BAND_HEIGHT_PX - blockHeight) / 2 + BAND_LINE_HEIGHT_PX * 0.78;
    const rowY = y;
    y += BAND_HEIGHT_PX;
    return (
      <g key={spec.bandTexts[index]}>
        <rect x={boxX} y={rowY} width={layout.widthPx} height={BAND_HEIGHT_PX} fill={BAND_COLORS[index]} />
        {lines.map((line, lineIndex) => (
          <text
            key={line}
            x={boxX + BAND_TEXT_PADDING_X}
            y={firstBaselineY + BAND_LINE_HEIGHT_PX * lineIndex}
            fontSize={BAND_FONT_PX}
            fontWeight={700}
            fill={BAND_TEXT_COLORS[index]}
          >
            {line}
          </text>
        ))}
      </g>
    );
  });
}

/**
 * BVVL round, ADIM 1 (2026-09-16/17): chart + the three Layer A bands drawn
 * as ONE image, not a separate `lines`+`image` pair — `place.ts` always
 * merges a `lines` cell to the block's full width, so a narrower chart and
 * full-width band cells could never actually share a width (Barış's own
 * correction, round 3). Hand-rolled SVG, no `ResponsiveContainer` (D-105/
 * D-113's own capture-hazard lesson) — every dimension comes from the
 * `size` this component is handed, never measured after mount.
 */
export function GapAnalysisChart({ spec, size }: { spec: GapAnalysisChartSpec; size: A3ImageSize }) {
  const compactWidthPx = Math.min(COMPACT_WIDTH_PT * PT_TO_PX, size.widthPx * 0.42);
  const maxWidthPx = Math.max(compactWidthPx, size.widthPx - CHART_MARGIN_PX);
  const layout = layoutGapBands(spec.bandTexts, BAND_FONT_PX, compactWidthPx, maxWidthPx);
  const boxX = (size.widthPx - layout.widthPx) / 2;

  const bandsHeightPx = BAND_HEIGHT_PX * spec.bandTexts.length;
  const chartHeightPx = Math.max(60, size.heightPx - bandsHeightPx);

  const maxValue = Math.max(spec.actualValue, spec.idealValue, 1) * 1.3;
  const plotTop = 26;
  const plotBottom = chartHeightPx - 34;
  const scaleY = (value: number) => plotBottom - (value / maxValue) * (plotBottom - plotTop);

  const barWidth = layout.widthPx * 0.22;
  const barGap = layout.widthPx * 0.3;
  const clusterWidth = barWidth * 2 + barGap;
  const clusterX = boxX + (layout.widthPx - clusterWidth) / 2;
  const actualBarX = clusterX;
  const idealBarX = clusterX + barWidth + barGap;
  const axisLeft = boxX;
  const axisRight = boxX + layout.widthPx;
  const actualTopY = scaleY(spec.actualValue);
  const idealTopY = scaleY(spec.idealValue);

  const deviation = Math.abs(spec.actualValue - spec.idealValue);
  const deviationText = deviation.toFixed(1).replace(".", ",");
  const bracketX = idealBarX + barWidth / 2;
  const dashStartX = actualBarX + barWidth;
  const labelX = (dashStartX + bracketX) / 2;
  const labelMidY = (actualTopY + idealTopY) / 2;

  return (
    <svg
      width={size.widthPx}
      height={size.heightPx}
      viewBox={`0 0 ${size.widthPx} ${size.heightPx}`}
    >
      <rect x={0} y={0} width={size.widthPx} height={size.heightPx} fill="#FFFFFF" />
      <text x={size.widthPx / 2} y={16} fontSize={13} fontWeight={700} textAnchor="middle" fill="#1A1A1A">
        {spec.title}
      </text>
      <line x1={axisLeft} y1={plotTop - 4} x2={axisLeft} y2={plotBottom} stroke="#C9C6BA" />
      <line x1={axisLeft} y1={plotBottom} x2={axisRight} y2={plotBottom} stroke="#C9C6BA" />

      <rect x={actualBarX} y={actualTopY} width={barWidth} height={plotBottom - actualTopY} fill={ACTUAL_COLOR} />
      <text x={actualBarX + barWidth / 2} y={actualTopY - 6} fontSize={12} fontWeight={700} fill={ACTUAL_COLOR} textAnchor="middle">
        {spec.actualValue}
        {spec.unit}
      </text>
      <text x={actualBarX + barWidth / 2} y={plotBottom + 16} fontSize={10} textAnchor="middle" fill="#5A584F">
        {spec.actualBarLabel}
      </text>
      {spec.actualDate && (
        <text x={actualBarX + barWidth / 2} y={plotBottom + 28} fontSize={9} textAnchor="middle" fill="#8A877C">
          ({spec.actualDate})
        </text>
      )}

      <rect x={idealBarX} y={idealTopY} width={barWidth} height={plotBottom - idealTopY} fill={IDEAL_COLOR} />
      <text x={idealBarX + barWidth / 2} y={idealTopY - 6} fontSize={12} fontWeight={700} fill="#2E7D32" textAnchor="middle">
        {spec.idealValue}
        {spec.unit}
      </text>
      <text x={idealBarX + barWidth / 2} y={plotBottom + 16} fontSize={10} textAnchor="middle" fill="#5A584F">
        {spec.idealBarLabel}
      </text>
      {spec.idealDate && (
        <text x={idealBarX + barWidth / 2} y={plotBottom + 28} fontSize={9} textAnchor="middle" fill="#8A877C">
          ({spec.idealDate})
        </text>
      )}

      <defs>
        <marker id="gapAnalysisArrow" markerWidth={8} markerHeight={8} refX={4} refY={4} orient="auto-start-reverse">
          <path d="M0,0 L8,4 L0,8 z" fill={PROBLEM_COLOR} />
        </marker>
      </defs>
      <line x1={dashStartX} y1={actualTopY} x2={bracketX} y2={actualTopY} stroke={PROBLEM_COLOR} strokeWidth={1.5} strokeDasharray="5 4" />
      <line
        x1={bracketX}
        y1={actualTopY}
        x2={bracketX}
        y2={idealTopY}
        stroke={PROBLEM_COLOR}
        strokeWidth={2}
        markerStart="url(#gapAnalysisArrow)"
        markerEnd="url(#gapAnalysisArrow)"
      />
      <text x={labelX} y={labelMidY - 8} fontSize={10.5} textAnchor="middle" fill={PROBLEM_COLOR}>
        {spec.deviationLabel}
      </text>
      <text x={labelX} y={labelMidY + 15} fontSize={18} fontWeight={700} textAnchor="middle" fill={PROBLEM_COLOR}>
        {deviationText}
        {spec.unit}
      </text>

      {drawBands(spec, layout, boxX, chartHeightPx)}
    </svg>
  );
}
