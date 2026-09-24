import type { A3ImageSize } from "../../a3/methodContract";
import { A3_MIN_PRINTED_FONT_PT, minImageFontPx } from "../../a3/readability";
import type { GapAnalysisChartSpec } from "../chartSpec";
import { layoutGapBands } from "./chartLayout";
import { wrapText } from "../../a3/layout/measure";

/** D-165 Layer A, reused verbatim — never redefined here. */
const IDEAL_COLOR = "#8FBF4F";
const ACTUAL_COLOR = "#4A90D9";
const PROBLEM_COLOR = "#E0342A";
const BAND_COLORS = [IDEAL_COLOR, ACTUAL_COLOR, PROBLEM_COLOR] as const;
const BAND_TEXT_COLORS = ["#1A1A1A", "#1A1A1A", "#FFFFFF"] as const;

const PT_TO_PX = 96 / 72;

/**
 * OKUNABİLİRLİK TABANI (`src/a3/readability.ts`, Barış 2026-09-22 —
 * DEĞİŞMEZ). Every piece of type in this chart is clamped to this, so the
 * chart runs out of room and drops/wraps content — which is visible — rather
 * than shrinking its own labels under the printed floor, which is not.
 * 10pt printed works out to 13.34px inside a rasterized A3 image.
 */
const MIN_FONT_PX = minImageFontPx();
/** The one label allowed to be BIGGER than the floor: the headline deviation number. */
const DEVIATION_VALUE_FONT_PX = Math.max(16, MIN_FONT_PX);
/** Real EK-2905 band box: cy=252000 EMU = 19.84pt — the three bands below the chart always share this one height, never their own individual line-count height (Barış's own correction, BVVL round 4). */
const BAND_HEIGHT_PT = 22;
const BAND_FONT_PT = A3_MIN_PRINTED_FONT_PT;
const BAND_LINE_HEIGHT_PT = 12;
const BAND_HEIGHT_PX = BAND_HEIGHT_PT * PT_TO_PX;
const BAND_FONT_PX = BAND_FONT_PT * PT_TO_PX;
const BAND_LINE_HEIGHT_PX = BAND_LINE_HEIGHT_PT * PT_TO_PX;
const BAND_TEXT_PADDING_X = 10;

/**
 * 2026-09-20 real-app follow-up (Barış's own direct report — the chart was
 * still reading as too small next to a real block, `reference/
 * PPS_A3_EK-2905_Yüksek_Fire_Problemi_10.08.2026.xlsx` given as the target):
 * root-caused via a real `buildA3Layout` run — the block's own *granted*
 * width was already generous (e.g. 636pt/848px on a real Step 1 block), but
 * the old `COMPACT_WIDTH_PT = 170` / `× 0.42` pair capped the chart at a
 * bare, content-driven minimum regardless of how much more room was
 * actually available, so the chart sat in a small corner of its own box.
 * `layoutGapBands`'s own "never force-wrap short text just to fill space"
 * behaviour (BVVL round 4, still correct — see `chartLayout.test.ts`) is
 * untouched; only the FLOOR fed into it here now tracks most of the real
 * available width (`COMPACT_WIDTH_RATIO`) instead of a small fixed minimum,
 * with `COMPACT_WIDTH_MIN_PT` only as a defensive floor for a pathologically
 * narrow allocation.
 */
const COMPACT_WIDTH_MIN_PT = 150;
const COMPACT_WIDTH_RATIO = 0.8;
const CHART_MARGIN_PX = 20;

/**
 * Real-app follow-up round 3 (2026-09-17): Barış's own concrete mockup,
 * mid-review — a real Y-axis with gridlines, value labels moved INSIDE
 * the bars (freeing the space above them entirely), and the deviation
 * indicator's horizontal bridge routed all the way past the rightmost bar
 * before dropping down, so its "Hedeften Sapma" label lands in genuinely
 * open margin space rather than the cramped gap between two bars —
 * closing the round-1/round-2 overlap complaints structurally instead of
 * shrinking text or moving it by a few px.
 */
const AXIS_LABEL_WIDTH_PX = 34;
const AXIS_TARGET_TICKS = 7;
const BRIDGE_MARGIN_PX = 16;
/**
 * Width the deviation label's own zone needs, measured from the REAL label
 * text rather than a hardcoded character count.
 *
 * It used to be `14 * …`, sized for the Turkish "Hedeften Sapma". The
 * English "Deviation from Target" is 21 characters, so on an English
 * project the label started inside the box and ended well outside it —
 * clipped mid-word, which is what Barış's 2026-09-23 screenshot shows.
 * A long label now wraps onto a second line instead of widening the zone
 * without bound and squeezing the bars out.
 */
const LABEL_MAX_CHARS_PER_LINE = 14;
function labelZoneWidthPx(label: string): number {
  const longest = wrapText(label, LABEL_MAX_CHARS_PER_LINE).reduce(
    (widest, line) => Math.max(widest, line.length),
    1,
  );
  return Math.ceil(longest * MIN_FONT_PX * 0.56);
}

/** Rounds `rough` up to the nearest "nice" step (1/2/5 × a power of ten) — standard chart-axis tick spacing. */
function niceAxisStep(rough: number): number {
  if (rough <= 0) {
    return 1;
  }
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const residual = rough / magnitude;
  const niceResidual = residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10;
  return niceResidual * magnitude;
}

/**
 * All three bands share ONE height (BVVL round 4's approved look), but that
 * height now follows the tallest band's real line count instead of a fixed
 * constant. With a fixed constant a two-line band's first baseline was
 * computed ABOVE its own rectangle and its text ran over the band below —
 * which is exactly what Barış's 2026-09-23 screenshot showed once the
 * printed-10pt floor made the bands wrap wider.
 */
function bandHeightFor(maxLines: number): number {
  return Math.max(BAND_HEIGHT_PX, maxLines * BAND_LINE_HEIGHT_PX + BAND_LINE_HEIGHT_PX * 0.45);
}

function drawBands(
  spec: GapAnalysisChartSpec,
  layout: ReturnType<typeof layoutGapBands>,
  boxX: number,
  startY: number,
) {
  const bandHeightPx = bandHeightFor(layout.maxLines);
  let y = startY;
  return layout.wrappedBands.map((lines, index) => {
    const blockHeight = lines.length * BAND_LINE_HEIGHT_PX;
    const firstBaselineY = y + (bandHeightPx - blockHeight) / 2 + BAND_LINE_HEIGHT_PX * 0.78;
    const rowY = y;
    y += bandHeightPx;
    return (
      <g key={spec.bandTexts[index]}>
        <rect x={boxX} y={rowY} width={layout.widthPx} height={bandHeightPx} fill={BAND_COLORS[index]} />
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

interface BarValueLayout {
  readonly y: number;
  readonly fontSize: number;
  readonly inside: boolean;
}

/** Below this, even the minimum readable font (`MIN_READABLE_FONT_PX`) plus its own padding doesn't fit inside the bar. */
const MIN_READABLE_FONT_PX = MIN_FONT_PX;
const INSIDE_FONT_PX = Math.max(14, MIN_FONT_PX);

/**
 * Real-app follow-up round 4 (2026-09-17, Barış's own direct correction):
 * round 3 kept an "above the bar" fallback for a bar shorter than
 * `MIN_BAR_HEIGHT_FOR_INSIDE_LABEL_PX` — the İdeal bar (a real, common
 * case: the target is usually the smaller of the two values) triggered
 * it every time, landing back on the exact "value above the bar" layout
 * Barış's own mockup replaced. His mockup shows "%3" sitting inside the
 * short green bar too, near its own top edge — always inside, never a
 * conditional fallback.
 *
 * Round 5 follow-up: a fixed 12px font clamped to stay above the bar's
 * own bottom edge still let the glyph's own ink poke out the TOP of a
 * genuinely short bar (12px of cap-height doesn't fit in a 10px-tall
 * bar no matter where the baseline sits) — Barış's own "İdeal Durum
 * yüzdesi barın dışında kalmış" catch. The font itself now shrinks for
 * a short bar (down to a 7px floor) instead of only moving the baseline,
 * so the whole glyph — not just its baseline — stays inside.
 *
 * Round 7 follow-up: a 7px value on a 10px-tall bar was technically
 * "inside" but read as illegibly tiny — Barış's own direct correction:
 * "İdeal Durum yüzdesi çok ufak kaldı... eğer içine sığmıyorsa üste
 * koyabilirsin" (too tiny — if it doesn't fit, put it above instead).
 * Below `MIN_READABLE_FONT_PX`'s own real floor, the value now moves
 * ABOVE the bar (this file's original round-3 fallback, reinstated —
 * this time an explicit choice rather than a guess) at a full, legible
 * 12px, rather than shrinking the font any further.
 */
function barValueLayout(
  topY: number,
  plotBottom: number,
  valueTextLength: number,
  barWidthPx: number,
): BarValueLayout {
  // A value printed inside its bar has to fit the bar in BOTH directions.
  // Only the height was checked before; once a block started sharing its
  // width between entries (2026-09-24) the bars got narrow enough that
  // "18.3%" spilled out over the bar's own edges, so the width is checked
  // too and the value moves above the bar when it cannot fit inside.
  const fitsWidth = valueTextLength * INSIDE_FONT_PX * 0.58 <= barWidthPx;
  const fontSizeIfInside = Math.min(INSIDE_FONT_PX, barHeightOf(topY, plotBottom) - 6);
  if (!fitsWidth || fontSizeIfInside < MIN_READABLE_FONT_PX) {
    return { y: topY - 6, fontSize: INSIDE_FONT_PX, inside: false };
  }
  return { y: topY + fontSizeIfInside + 2, fontSize: fontSizeIfInside, inside: true };
}

function barHeightOf(topY: number, plotBottom: number): number {
  return plotBottom - topY;
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
  const maxWidthPx = Math.max(COMPACT_WIDTH_MIN_PT * PT_TO_PX, size.widthPx - CHART_MARGIN_PX);
  const compactWidthPx = Math.max(COMPACT_WIDTH_MIN_PT * PT_TO_PX, Math.min(size.widthPx * COMPACT_WIDTH_RATIO, maxWidthPx));
  const layout = layoutGapBands(spec.bandTexts, BAND_FONT_PX, compactWidthPx, maxWidthPx);
  const boxX = (size.widthPx - layout.widthPx) / 2;

  const bandsHeightPx = bandHeightFor(layout.maxLines) * spec.bandTexts.length;
  const chartHeightPx = Math.max(60, size.heightPx - bandsHeightPx);

  const plotTop = 26;
  const plotLeft = boxX + AXIS_LABEL_WIDTH_PX;
  const plotRight = boxX + layout.widthPx;
  const plotWidth = plotRight - plotLeft;

  /** Characters of `text` that fit in `widthPx` at the floor font. */
  const charsThatFit = (widthPx: number) => Math.max(4, Math.floor(widthPx / (MIN_FONT_PX * 0.55)));

  /**
   * The deviation label's zone is reserved BEFORE the bars are laid out
   * (round 3 follow-up: left to whatever the bars did not claim, it never
   * got enough). But it is also CAPPED at a share of the plot — once a
   * block lays its entries out horizontally (2026-09-24) this chart can be
   * a third of a half-sheet wide, and a zone sized purely from the label's
   * own text then ate most of the plot and squeezed the bars into slivers.
   */
  const labelZonePx = Math.max(
    40,
    Math.min(labelZoneWidthPx(spec.deviationLabel), plotWidth * 0.42),
  );
  const deviationLabelLines = wrapText(spec.deviationLabel, charsThatFit(labelZonePx));

  const barsAreaWidth = Math.max(60, plotWidth - labelZonePx - BRIDGE_MARGIN_PX);
  const barWidth = barsAreaWidth * 0.26;
  const barGap = barsAreaWidth * 0.3;
  const clusterWidth = barWidth * 2 + barGap;
  const clusterX = plotLeft + (barsAreaWidth - clusterWidth) / 2;
  const actualBarX = clusterX;
  const idealBarX = clusterX + barWidth + barGap;

  /**
   * Each bar's caption wraps into its OWN slot — the distance between the
   * two bar centres — instead of being one centred line that grows until it
   * runs into its neighbour. At a third of a half-sheet the two captions
   * printed straight over each other ("CurrentIdealStateState"), which is
   * what a fixed single line always does once the bars get close.
   */
  const captionSlotPx = barWidth + barGap;
  const captionChars = charsThatFit(captionSlotPx);
  const actualCaptionLines = wrapText(spec.actualBarLabel, captionChars);
  const idealCaptionLines = wrapText(spec.idealBarLabel, captionChars);
  const captionLineCount = Math.max(actualCaptionLines.length, idealCaptionLines.length);
  const hasDates = Boolean(spec.actualDate || spec.idealDate);
  const captionLineHeight = MIN_FONT_PX * 1.15;
  // Room under the axis for however many caption lines the labels really
  // needed, plus the period in brackets when there is one.
  const axisCaptionHeight = (captionLineCount + (hasDates ? 1 : 0)) * captionLineHeight + 10;
  const plotBottom = Math.max(plotTop + 30, chartHeightPx - axisCaptionHeight);

  // Real Y-axis (round 3 follow-up) — a "nice" step/max so ticks land on
  // clean numbers, not the old maxValue*1.3 magic headroom.
  const rawMax = Math.max(spec.actualValue, spec.idealValue, 1) * 1.15;
  const axisStep = niceAxisStep(rawMax / AXIS_TARGET_TICKS);
  const axisMax = Math.ceil(rawMax / axisStep) * axisStep;
  const tickCount = Math.round(axisMax / axisStep);
  const ticks = Array.from({ length: tickCount + 1 }, (_, index) => index * axisStep);
  const scaleY = (value: number) => plotBottom - (value / axisMax) * (plotBottom - plotTop);

  const actualTopY = scaleY(spec.actualValue);
  const idealTopY = scaleY(spec.idealValue);

  const deviation = Math.abs(spec.actualValue - spec.idealValue);
  const deviationText = deviation.toFixed(1).replace(".", ",");
  const actualValueText = `${spec.actualValue}${spec.unit}`;
  const idealValueText = `${spec.idealValue}${spec.unit}`;
  const actualValueLayout = barValueLayout(actualTopY, plotBottom, actualValueText.length, barWidth);
  const idealValueLayout = barValueLayout(idealTopY, plotBottom, idealValueText.length, barWidth);

  const bridgeX = idealBarX + barWidth + BRIDGE_MARGIN_PX;
  const labelX = bridgeX + 10;
  const labelMidY = (actualTopY + idealTopY) / 2;

  return (
    <svg
      width={size.widthPx}
      height={size.heightPx}
      viewBox={`0 0 ${size.widthPx} ${size.heightPx}`}
    >
      <rect x={0} y={0} width={size.widthPx} height={size.heightPx} fill="#FFFFFF" />
      <text x={size.widthPx / 2} y={MIN_FONT_PX + 4} fontSize={MIN_FONT_PX} fontWeight={700} textAnchor="middle" fill="#1A1A1A">
        {spec.title}
      </text>

      {ticks.map((tick) => {
        const y = scaleY(tick);
        return (
          <g key={tick}>
            <line x1={plotLeft} y1={y} x2={plotRight} y2={y} stroke="#EEECE4" />
            <text x={plotLeft - 6} y={y + 3} fontSize={MIN_FONT_PX} textAnchor="end" fill="#8A877C">
              {tick}
              {spec.unit}
            </text>
          </g>
        );
      })}
      <line x1={plotLeft} y1={plotTop - 4} x2={plotLeft} y2={plotBottom} stroke="#C9C6BA" />
      <line x1={plotLeft} y1={plotBottom} x2={plotRight} y2={plotBottom} stroke="#C9C6BA" />

      <rect x={actualBarX} y={actualTopY} width={barWidth} height={plotBottom - actualTopY} fill={ACTUAL_COLOR} />
      <text
        x={actualBarX + barWidth / 2}
        y={actualValueLayout.y}
        fontSize={actualValueLayout.fontSize}
        fontWeight={700}
        fill={actualValueLayout.inside ? "#FFFFFF" : ACTUAL_COLOR}
        textAnchor="middle"
      >
        {spec.actualValue}
        {spec.unit}
      </text>
      {actualCaptionLines.map((line, index) => (
        <text
          key={line}
          x={actualBarX + barWidth / 2}
          y={plotBottom + captionLineHeight * (index + 1)}
          fontSize={MIN_FONT_PX}
          textAnchor="middle"
          fill="#5A584F"
        >
          {line}
        </text>
      ))}
      {spec.actualDate && (
        <text
          x={actualBarX + barWidth / 2}
          y={plotBottom + captionLineHeight * (captionLineCount + 1)}
          fontSize={MIN_FONT_PX}
          textAnchor="middle"
          fill="#8A877C"
        >
          ({spec.actualDate})
        </text>
      )}

      <rect x={idealBarX} y={idealTopY} width={barWidth} height={plotBottom - idealTopY} fill={IDEAL_COLOR} />
      <text
        x={idealBarX + barWidth / 2}
        y={idealValueLayout.y}
        fontSize={idealValueLayout.fontSize}
        fontWeight={700}
        fill={idealValueLayout.inside ? "#FFFFFF" : "#2E7D32"}
        textAnchor="middle"
      >
        {spec.idealValue}
        {spec.unit}
      </text>
      {idealCaptionLines.map((line, index) => (
        <text
          key={line}
          x={idealBarX + barWidth / 2}
          y={plotBottom + captionLineHeight * (index + 1)}
          fontSize={MIN_FONT_PX}
          textAnchor="middle"
          fill="#5A584F"
        >
          {line}
        </text>
      ))}
      {spec.idealDate && (
        <text
          x={idealBarX + barWidth / 2}
          y={plotBottom + captionLineHeight * (captionLineCount + 1)}
          fontSize={MIN_FONT_PX}
          textAnchor="middle"
          fill="#8A877C"
        >
          ({spec.idealDate})
        </text>
      )}

      <defs>
        {/* Round 5 follow-up: `refX`/`refY` were set to the marker's own
            CENTER (2,2), not its tip — the actual SVG marker contract
            aligns whichever local point `refX`/`refY` names with the
            line's real endpoint, so a center-aligned marker draws its
            tip ~half the marker's own size PAST that endpoint (past the
            dashed bridge line it should stop at — Barış's own "arrows
            should stay between the [bridge] lines" catch). `refX`
            (always equal to `markerWidth`, the tip's own local x) puts
            the tip exactly at the endpoint, the flat base trailing back
            along the line instead. Round 7: shrunk again, by exactly the
            50% Barış asked for (3×3 → 1.5×1.5). */}
        <marker id="gapAnalysisArrow" markerWidth={1.5} markerHeight={1.5} refX={1.5} refY={0.75} orient="auto-start-reverse">
          <path d="M0,0 L1.5,0.75 L0,1.5 z" fill={PROBLEM_COLOR} />
        </marker>
      </defs>
      <line x1={actualBarX + barWidth} y1={actualTopY} x2={bridgeX} y2={actualTopY} stroke={PROBLEM_COLOR} strokeWidth={1.5} strokeDasharray="5 4" />
      <line x1={idealBarX + barWidth} y1={idealTopY} x2={bridgeX} y2={idealTopY} stroke={PROBLEM_COLOR} strokeWidth={1.5} strokeDasharray="5 4" />
      <line
        x1={bridgeX}
        y1={actualTopY}
        x2={bridgeX}
        y2={idealTopY}
        stroke={PROBLEM_COLOR}
        strokeWidth={1.5}
        markerStart="url(#gapAnalysisArrow)"
        markerEnd="url(#gapAnalysisArrow)"
      />
      {deviationLabelLines.map((line, index) => (
        <text
          key={line}
          x={labelX}
          y={labelMidY - 4 - (deviationLabelLines.length - 1 - index) * MIN_FONT_PX * 1.15}
          fontSize={MIN_FONT_PX}
          textAnchor="start"
          fill={PROBLEM_COLOR}
        >
          {line}
        </text>
      ))}
      <text x={labelX} y={labelMidY + DEVIATION_VALUE_FONT_PX} fontSize={DEVIATION_VALUE_FONT_PX} fontWeight={700} textAnchor="start" fill={PROBLEM_COLOR}>
        {deviationText}
        {spec.unit}
      </text>

      {drawBands(spec, layout, boxX, chartHeightPx)}

    </svg>
  );
}
