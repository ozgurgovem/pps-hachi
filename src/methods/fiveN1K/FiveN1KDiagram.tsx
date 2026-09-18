import { estimateCharsPerLine, wrapText } from "../../a3/layout/measure";
import type { A3ImageSize } from "../../a3/methodContract";
import type { FiveN1KDiagramSpec } from "../chartSpec";

/**
 * Round 9 (2026-09-17): full redesign from a real Farplas corporate design
 * handoff (`reference/5N1K tablosu tasarımı.zip`, `5N1K Tablosu.dc.html` +
 * its own README) — Barış exported a high-fidelity spec from Claude Design
 * and asked for it recreated pixel-faithfully in this codebase's own SVG
 * pipeline. The row-by-row chevron+answer STRUCTURE (round 6/7/8's own
 * shape) carries over unchanged; what changes is the visual language:
 * - a real header (bold "5N1K" title, a rule, a red accent bar) replacing
 *   the old small hub label — the design's own literal header treatment.
 * - the six chevrons now use the design's own two-brand-color ladder
 *   (anthracite × 2, teal × 2, red × 2 — darkened via the same
 *   `color-mix(…, #000)` stops the design's own README computes, so 17px
 *   bold/12px white label text keeps 4.5:1 contrast) instead of D-165's six
 *   distinct category hues — colors now come from `renderToA3.ts`'s own
 *   `ROW_LADDER`, not per-item semantic hues.
 * - zero-padded row numbers (01–06), left-aligned inside the chevron —
 *   the design's own new element, not present before.
 * - the answer "box" (round 7/8's own shared/fitted width) is gone
 *   entirely — every row's answer panel now fills the FULL remaining row
 *   width (the design's own `flex` panel, not a fitted box), with a 3px
 *   left border in the row's own color. This structurally closes the
 *   "boxes read uneven" complaint round 8 was still patching around: there
 *   is no longer a box whose width could ever differ from its neighbours.
 * Absolute pixel values in the design's own handoff assume an 980px-wide
 * desktop canvas (`$preview: {width: 980, height: 760}`) — 2.6× wider than
 * this diagram's own real ~378px block width, so sizes here are chosen to
 * preserve the design's LANGUAGE (chevron shape, ladder, header structure,
 * proportions) at this component's own real, much narrower scale, not
 * copied as literal px (the design's own README explicitly calls this out:
 * "Responsive: fluid down to narrow widths... no fixed width").
 *
 * Round 9 follow-up (2026-09-17, Barış's own annotated screenshot of round
 * 9's real render): two real bugs. (1) `chevronPoints` kept round 6's own
 * inward notch on the LEFT edge too (a "ribbon" shape, pointed both ends) —
 * the design's own `clip-path` only points the RIGHT edge, the left edge is
 * a flat vertical line (`0 0, ..., 0 100%`); the row number sat right where
 * that left notch cut inward, reading as stranded outside the shape. Fixed
 * by dropping the polygon's 6th point — flat left edge, matching the
 * design exactly. (2) row height was derived from `size.heightPx` directly
 * (same formula every round 6-9 diagram used), so ADIM 1's own elastic
 * growth (Faz 11/L3a) stretched every row taller and taller with no floor
 * — six visibly over-tall, sparse rows the moment neighbouring steps went
 * empty. Barış's own instruction: row height must stay fixed, and if the
 * granted box doesn't match the diagram's own natural proportions, scale
 * the WHOLE diagram uniformly (never stretch one axis independently).
 * `ROW_HEIGHT_PX` is now a constant (tuned to the static default's own
 * already-approved 27.8px); the `viewBox` is sized to the diagram's own
 * fixed natural height, not `size.heightPx`, and `preserveAspectRatio`
 * lets the SVG's own native scaling handle the rest — growing or shrinking
 * uniformly to fit whatever real box `place.ts` hands it, anchored to the
 * top-left (`xMinYMin`) so the header always sits at the block's own top
 * edge rather than floating centred with blank space above it.
 */
const HEADER_TITLE_FONT_PX = 14;
const HEADER_TITLE_COLOR = "#1F2124";
const HEADER_RULE_COLOR = "#53565A";
const HEADER_RULE_WIDTH_PX = 1.5;
const HEADER_ACCENT_COLOR = "#ED212E";
const HEADER_ACCENT_HEIGHT_PX = 2;
const HEADER_ACCENT_WIDTH_PX = 36;
const HEADER_HEIGHT_PX = 26;

const ROW_GAP_PX = 3;
/** Fixed — never derived from `size.heightPx` (see this file's own round-9-follow-up note). */
const ROW_HEIGHT_PX = 27.8;
const LABEL_WIDTH_PX = 74;
const CHEVRON_NOTCH_PX = 9;
const LABEL_FONT_PX = 8.5;
const ROW_NUMBER_FONT_PX = 6;
const ROW_NUMBER_X_PX = 4;

const ANSWER_FONT_PX = 9.5;
const ANSWER_LINE_HEIGHT_PX = 10.5;
const MAX_ANSWER_LINES = 2;
const ANSWER_PANEL_FILL = "#F5F4F2";
const ANSWER_PANEL_BORDER_PX = 3;
const ANSWER_TEXT_PADDING_LEFT_PX = 10;
const ANSWER_TEXT_PADDING_RIGHT_PX = 8;
const ANSWER_INK = "#33363A";
const ELLIPSIS = "…";

/** Truncates an answer to what its own row can actually show — the stored payload is never touched, only this rendered copy. */
function fitAnswerLines(answer: string, availableWidthPx: number, maxLines: number): readonly string[] {
  const charsPerLine = estimateCharsPerLine(availableWidthPx, ANSWER_FONT_PX);
  const lines = wrapText(answer, charsPerLine);
  if (lines.length <= maxLines) {
    return lines;
  }
  const lastLine = lines[maxLines - 1] ?? "";
  const truncated = lastLine.length > 1 ? lastLine.slice(0, -1) : lastLine;
  return [...lines.slice(0, maxLines - 1), `${truncated}${ELLIPSIS}`];
}

/** A right-pointing chevron/arrow shape — matches the design's own `clip-path: polygon(...)` outline exactly: a FLAT left edge, only the right edge points. */
function chevronPoints(width: number, height: number): string {
  const notch = Math.min(CHEVRON_NOTCH_PX, height / 2);
  return [`0,0`, `${width - notch},0`, `${width},${height / 2}`, `${width - notch},${height}`, `0,${height}`].join(" ");
}

export function FiveN1KDiagram({ spec, size }: { spec: FiveN1KDiagramSpec; size: A3ImageSize }) {
  const rowCount = spec.items.length;
  const rowHeight = ROW_HEIGHT_PX;
  const answerAreaX = LABEL_WIDTH_PX;
  const answerAreaWidthPx = Math.max(20, size.widthPx - answerAreaX);
  const answerTextWidthPx = Math.max(
    10,
    answerAreaWidthPx - ANSWER_TEXT_PADDING_LEFT_PX - ANSWER_TEXT_PADDING_RIGHT_PX,
  );
  // A row taller than one line's own height can afford a second line —
  // never fewer than one, never more than the file's own cap.
  const maxLinesForRow = Math.min(MAX_ANSWER_LINES, Math.max(1, Math.floor(rowHeight / ANSWER_LINE_HEIGHT_PX)));

  const rows = spec.items.map((item, index) => ({
    item,
    rowNumber: String(index + 1).padStart(2, "0"),
    answerLines: item.answer ? fitAnswerLines(item.answer, answerTextWidthPx, maxLinesForRow) : [],
  }));

  // The diagram's own fixed natural size — independent of `size.heightPx`.
  // `preserveAspectRatio="xMinYMin meet"` then scales this UNIFORMLY (both
  // axes together, never stretching one alone) to fit whatever real box
  // `size` actually is, anchored to the top-left so the header always
  // lands at the block's own top edge; any leftover room (when the real
  // box is taller than this diagram's own natural height) stays blank
  // below it instead of being absorbed into taller rows.
  const naturalHeightPx = HEADER_HEIGHT_PX + rowCount * rowHeight + (rowCount - 1) * ROW_GAP_PX;

  return (
    <svg
      width={size.widthPx}
      height={size.heightPx}
      viewBox={`0 0 ${size.widthPx} ${naturalHeightPx}`}
      preserveAspectRatio="xMinYMin meet"
    >
      <rect x={0} y={0} width={size.widthPx} height={naturalHeightPx} fill="#FFFFFF" />

      <text x={0} y={HEADER_TITLE_FONT_PX} fontSize={HEADER_TITLE_FONT_PX} fontWeight={900} fill={HEADER_TITLE_COLOR}>
        {spec.hubLabel}
      </text>
      <line
        x1={0}
        y1={HEADER_TITLE_FONT_PX + 4}
        x2={size.widthPx}
        y2={HEADER_TITLE_FONT_PX + 4}
        stroke={HEADER_RULE_COLOR}
        strokeWidth={HEADER_RULE_WIDTH_PX}
      />
      <rect
        x={0}
        y={HEADER_TITLE_FONT_PX + 6}
        width={HEADER_ACCENT_WIDTH_PX}
        height={HEADER_ACCENT_HEIGHT_PX}
        fill={HEADER_ACCENT_COLOR}
      />

      {rows.map(({ item, rowNumber, answerLines }, index) => {
        const rowY = HEADER_HEIGHT_PX + index * (rowHeight + ROW_GAP_PX);
        const answerBlockHeight = answerLines.length * ANSWER_LINE_HEIGHT_PX;
        const answerStartY = rowY + (rowHeight - answerBlockHeight) / 2 + ANSWER_LINE_HEIGHT_PX * 0.78;

        return (
          <g key={item.label}>
            <polygon points={chevronPoints(LABEL_WIDTH_PX, rowHeight)} fill={item.color} transform={`translate(0, ${rowY})`} />
            <text
              x={ROW_NUMBER_X_PX}
              y={rowY + rowHeight / 2 + ROW_NUMBER_FONT_PX * 0.35}
              fontSize={ROW_NUMBER_FONT_PX}
              fontWeight={600}
              fill="#FFFFFF"
            >
              {rowNumber}
            </text>
            <text
              x={LABEL_WIDTH_PX - CHEVRON_NOTCH_PX - 4}
              y={rowY + rowHeight / 2 + 3}
              fontSize={LABEL_FONT_PX}
              fontWeight={700}
              fill="#FFFFFF"
              textAnchor="end"
              letterSpacing="0.03em"
            >
              {item.label}
            </text>

            <rect x={answerAreaX} y={rowY} width={answerAreaWidthPx} height={rowHeight} fill={ANSWER_PANEL_FILL} />
            <rect x={answerAreaX} y={rowY} width={ANSWER_PANEL_BORDER_PX} height={rowHeight} fill={item.color} />
            {answerLines.map((line, lineIndex) => (
              <text
                key={line}
                x={answerAreaX + ANSWER_TEXT_PADDING_LEFT_PX}
                y={answerStartY + lineIndex * ANSWER_LINE_HEIGHT_PX}
                fontSize={ANSWER_FONT_PX}
                fill={ANSWER_INK}
              >
                {line}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}
