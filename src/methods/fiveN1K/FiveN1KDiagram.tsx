import { estimateCharsPerLine, wrapText } from "../../a3/layout/measure";
import type { A3ImageSize } from "../../a3/methodContract";
import type { FiveN1KDiagramSpec } from "../chartSpec";

const ANSWER_FONT_PX = 9.5;
const ANSWER_LINE_HEIGHT_PX = 11;
const MAX_ANSWER_LINES = 2;
const ELLIPSIS = "…";

/** Truncates an answer to what its own satellite circle can actually show — the stored payload is never touched, only this rendered copy. */
function fitAnswerLines(answer: string, availableWidthPx: number): readonly string[] {
  const charsPerLine = estimateCharsPerLine(availableWidthPx, ANSWER_FONT_PX);
  const lines = wrapText(answer, charsPerLine);
  if (lines.length <= MAX_ANSWER_LINES) {
    return lines;
  }
  const lastLine = lines[MAX_ANSWER_LINES - 1] ?? "";
  const truncated = lastLine.length > 1 ? lastLine.slice(0, -1) : lastLine;
  return [...lines.slice(0, MAX_ANSWER_LINES - 1), `${truncated}${ELLIPSIS}`];
}

/**
 * BVVL round, ADIM 1 (2026-09-17): a REAL circle — the same radius on both
 * axes — not a wide ellipse. An earlier round stretched the orbit radius
 * far wider than tall to fit a short rowSpan, which drew the six "petal"
 * connector lines crossing through each other in a bowtie shape instead of
 * the reference's own non-crossing rosette; Barış caught it directly from
 * the rendered mockup.
 *
 * Sized as a FRACTION of the block's own given height, not a fixed pt
 * constant — ADIM 1's real row budget (D-158/D-160's elastic column solver)
 * is shared with `gapStatement`'s own image, and the two together are
 * already at that column's real ceiling (`renderToA3.ts`'s own note); a
 * proportional diagram stays a real, non-crossing circle at whatever
 * height it actually receives, on any template, rather than needing its
 * own constant re-tuned every time either image's row budget changes.
 */
const ORBIT_TO_SATELLITE_RATIO = 2.4;
const SATELLITE_TO_HUB_RATIO = 0.65;
const DIAGRAM_PADDING_PX = 8;

export function FiveN1KDiagram({ spec, size }: { spec: FiveN1KDiagramSpec; size: A3ImageSize }) {
  const availableRadius = Math.max(20, size.heightPx / 2 - DIAGRAM_PADDING_PX);
  const satelliteRadius = availableRadius / (1 + ORBIT_TO_SATELLITE_RATIO);
  const orbitRadius = satelliteRadius * ORBIT_TO_SATELLITE_RATIO;
  const hubRadius = satelliteRadius * SATELLITE_TO_HUB_RATIO;

  const centerX = size.widthPx / 2;
  const centerY = size.heightPx / 2;
  const angleStepDeg = 360 / spec.items.length;

  return (
    <svg width={size.widthPx} height={size.heightPx} viewBox={`0 0 ${size.widthPx} ${size.heightPx}`}>
      <rect x={0} y={0} width={size.widthPx} height={size.heightPx} fill="#FFFFFF" />
      {spec.items.map((item, index) => {
        const angleDeg = -90 + index * angleStepDeg;
        const angleRad = (angleDeg * Math.PI) / 180;
        const petalX = centerX + orbitRadius * Math.cos(angleRad);
        const petalY = centerY + orbitRadius * Math.sin(angleRad);
        const answerLines = item.answer ? fitAnswerLines(item.answer, satelliteRadius * 1.6) : [];
        const answerStartY = petalY + 10;
        return (
          <g key={item.label}>
            <line
              x1={centerX}
              y1={centerY}
              x2={petalX}
              y2={petalY}
              stroke={item.color}
              strokeWidth={satelliteRadius * 1.05}
              strokeLinecap="round"
              opacity={0.9}
            />
            <circle cx={petalX} cy={petalY} r={satelliteRadius} fill={item.color} stroke="#FFFFFF" strokeWidth={2.5} />
            <text x={petalX} y={petalY - 6} fontSize={12} fontWeight={700} fill="#FFFFFF" textAnchor="middle">
              {item.label}
            </text>
            {answerLines.map((line, lineIndex) => (
              <text
                key={line}
                x={petalX}
                y={answerStartY + lineIndex * ANSWER_LINE_HEIGHT_PX}
                fontSize={ANSWER_FONT_PX}
                fill="#FFFFFF"
                textAnchor="middle"
              >
                {line}
              </text>
            ))}
          </g>
        );
      })}
      <circle cx={centerX} cy={centerY} r={hubRadius} fill="#FFFFFF" stroke="#2B2A24" strokeWidth={2.5} />
      <text x={centerX} y={centerY + 5} fontSize={13} fontWeight={700} fill="#2B2A24" textAnchor="middle">
        {spec.hubLabel}
      </text>
    </svg>
  );
}
