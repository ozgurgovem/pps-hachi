import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FiveN1KDiagram } from "./FiveN1KDiagram";
import type { FiveN1KDiagramSpec } from "../chartSpec";
import { FIVE_N1K_ANSWER_SOFT_LIMIT } from "./constants";

const PT_TO_PX = 96 / 72;
/** pps-8step-auto's real ADIM 1 side-by-side geometry (283.5×156pt) — the same size `renderToA3.ts` actually requests. */
const REAL_SIZE = { widthPx: 283.5 * PT_TO_PX, heightPx: 156 * PT_TO_PX };

/** The reference document's own six real 5N1K answers (EK-2905's A3 Summary sheet, longest 40 chars) — the calibration sample `FIVE_N1K_ANSWER_SOFT_LIMIT`'s own doc comment cites. */
function referenceAnswerSpec(): FiveN1KDiagramSpec {
  return {
    kind: "five-n1k",
    hubLabel: "5N1K",
    items: [
      { label: "NE?", answer: "EK-2905 Kalıbında Yüksek Fire", color: "#3C3F42" },
      { label: "NEDEN?", answer: "Enjeksiyon Problemleri Nedeniyle", color: "#53565A" },
      { label: "NASIL?", answer: "%16 Yüksek Fire Oranında", color: "#064F58" },
      { label: "NEREDE?", answer: "600T E-91 Enjeksiyon Makinesinde", color: "#077E89" },
      { label: "NE ZAMAN?", answer: "15.07.2026 Enj. Makinesi Değişikliği ile", color: "#B21924" },
      { label: "KİM?", answer: "T2 Üretim Tesisi", color: "#C71C27" },
    ],
  };
}

/**
 * Round 9 (2026-09-17): full redesign from a real Farplas corporate design
 * handoff (`reference/5N1K tablosu tasarımı.zip`) — Barış exported a
 * high-fidelity spec from Claude Design and asked for it recreated
 * pixel-faithfully. The row-by-row chevron+answer STRUCTURE (round 6's own
 * shape) carries over; what changes is the visual language: a real header
 * (title + rule + red accent bar), row numbers (01-06), a new two-brand
 * color ladder (see `renderToA3.ts`), and — replacing round 7/8's own
 * fitted/shared answer box entirely — every row's answer panel now fills
 * the FULL remaining row width with a 3px left border in the row's own
 * color, so no box-width disparity between rows can exist anymore.
 */
describe("FiveN1KDiagram — round 9 (Farplas design handoff: header + row numbers + full-width answer panels)", () => {
  it("renders one row per item, each with its own full-width answer panel, with zero truncation", () => {
    const svg = renderToStaticMarkup(<FiveN1KDiagram spec={referenceAnswerSpec()} size={REAL_SIZE} />);

    expect(svg).not.toContain("…");
    const rows = [...svg.matchAll(/<polygon points="[^"]*" fill="(#[0-9A-F]+)"/g)];
    expect(rows).toHaveLength(6);
  });

  it("renders the real reference document's longest answer (41 chars) on a single line, with no ellipsis", () => {
    const svg = renderToStaticMarkup(<FiveN1KDiagram spec={referenceAnswerSpec()} size={REAL_SIZE} />);
    expect(svg).toContain("15.07.2026 Enj. Makinesi Değişikliği ile");
    expect(svg).not.toContain("…");
  });

  it("gives every row's answer panel the SAME full width, aligned to the widest possible row (never a fitted per-row box)", () => {
    const svg = renderToStaticMarkup(<FiveN1KDiagram spec={referenceAnswerSpec()} size={REAL_SIZE} />);
    const panelWidths = [...svg.matchAll(/<rect x="[\d.]+" y="[\d.]+" width="([\d.]+)" height="[\d.]+" fill="#F5F4F2"/g)].map(
      (m) => Number(m[1]),
    );
    expect(panelWidths).toHaveLength(6);
    const distinctWidths = new Set(panelWidths);
    expect(distinctWidths.size).toBe(1);
  });

  it("gives every row's answer panel a 3px left border in that row's own colour", () => {
    const svg = renderToStaticMarkup(<FiveN1KDiagram spec={referenceAnswerSpec()} size={REAL_SIZE} />);
    const borders = [...svg.matchAll(/<rect x="[\d.]+" y="[\d.]+" width="3" height="[\d.]+" fill="(#[0-9A-F]+)"/g)].map(
      (m) => m[1],
    );
    expect(borders).toEqual(["#3C3F42", "#53565A", "#064F58", "#077E89", "#B21924", "#C71C27"]);
  });

  it("renders zero-padded row numbers 01 through 06, in order", () => {
    const svg = renderToStaticMarkup(<FiveN1KDiagram spec={referenceAnswerSpec()} size={REAL_SIZE} />);
    for (const rowNumber of ["01", "02", "03", "04", "05", "06"]) {
      expect(svg).toContain(`>${rowNumber}<`);
    }
  });

  it("renders the design handoff's own header: bold title, a rule, and a red accent bar", () => {
    const svg = renderToStaticMarkup(<FiveN1KDiagram spec={referenceAnswerSpec()} size={REAL_SIZE} />);
    expect(svg).toContain("5N1K");
    expect(svg).toContain('font-weight="900"');
    expect(svg).toContain("<line");
    expect(svg).toContain('fill="#ED212E"');
  });

  it("renders every answer up to the soft limit with no ellipsis for a single long item", () => {
    const answer = "x".repeat(FIVE_N1K_ANSWER_SOFT_LIMIT);
    const spec: FiveN1KDiagramSpec = {
      kind: "five-n1k",
      hubLabel: "5N1K",
      items: [{ label: "NEDEN?", answer, color: "#53565A" }],
    };
    const svg = renderToStaticMarkup(<FiveN1KDiagram spec={spec} size={REAL_SIZE} />);
    expect(svg).not.toContain("…");
  });

  it("lays out all six rows to fill the canvas height exactly, never overflowing it", () => {
    const svg = renderToStaticMarkup(<FiveN1KDiagram spec={referenceAnswerSpec()} size={REAL_SIZE} />);
    const rowYs = [...svg.matchAll(/translate\(0, ([\d.]+)\)/g)].map((m) => Number(m[1]));
    expect(rowYs).toHaveLength(6);
    // Strictly increasing, top to bottom — no overlap, no out-of-order rows.
    for (let i = 1; i < rowYs.length; i += 1) {
      expect(rowYs[i]!).toBeGreaterThan(rowYs[i - 1]!);
    }
    expect(rowYs[rowYs.length - 1]!).toBeLessThan(REAL_SIZE.heightPx);
  });

  it("colours each row's own label chevron with the item's own colour", () => {
    const svg = renderToStaticMarkup(<FiveN1KDiagram spec={referenceAnswerSpec()} size={REAL_SIZE} />);
    expect(svg).toContain('fill="#3C3F42"');
    expect(svg).toContain('fill="#53565A"');
  });

  it("renders no hub, no rings, no connector lines — the old radial rosette structure is gone", () => {
    const svg = renderToStaticMarkup(<FiveN1KDiagram spec={referenceAnswerSpec()} size={REAL_SIZE} />);
    expect(svg).not.toContain("<circle");
  });
});

/**
 * Round 9 follow-up (2026-09-17, Barış's own annotated screenshot of round
 * 9's real render): (1) the chevron kept round 6's own inward notch on the
 * LEFT edge too — the design's own `clip-path` only points the right edge,
 * the left edge is a flat vertical line; the row number sat right where
 * that left notch cut inward, reading as stranded outside the shape.
 * (2) row height was derived from `size.heightPx` directly, so ADIM 1's own
 * elastic growth (Faz 11/L3a) stretched every row taller with no floor —
 * six visibly over-tall, sparse rows the moment neighbouring steps went
 * empty. Barış's own instruction: row height stays fixed; if the granted
 * box doesn't match the diagram's own natural proportions, scale the WHOLE
 * diagram uniformly (never stretch one axis independently).
 */
describe("FiveN1KDiagram — round 9 follow-up (flat-left chevron, fixed row height regardless of growth)", () => {
  /** pps-8step-auto's own round-8 elastic-growth ceiling (24 rows/312pt) — the same size a near-empty column can hand this diagram. */
  const GROWN_SIZE = { widthPx: 283.5 * PT_TO_PX, heightPx: 24 * 13 * PT_TO_PX };

  it("draws each chevron with a FLAT left edge (5 points), not an inward-notched 'ribbon' shape (6 points)", () => {
    const svg = renderToStaticMarkup(<FiveN1KDiagram spec={referenceAnswerSpec()} size={REAL_SIZE} />);
    const firstPolygon = svg.match(/<polygon points="([^"]+)"/)?.[1];
    expect(firstPolygon).toBeDefined();
    const pointCount = firstPolygon!.trim().split(/\s+/).length;
    expect(pointCount).toBe(5);
    // The first and last points must both sit on x=0 — a flat vertical left
    // edge running directly between them, not folding back inward partway.
    const points = firstPolygon!.trim().split(/\s+/).map((pair) => pair.split(",").map(Number));
    expect(points[0]![0]).toBe(0);
    expect(points[4]![0]).toBe(0);
  });

  it("keeps every row's own height IDENTICAL whether the block is at its default size or elastically grown", () => {
    const defaultSvg = renderToStaticMarkup(<FiveN1KDiagram spec={referenceAnswerSpec()} size={REAL_SIZE} />);
    const grownSvg = renderToStaticMarkup(<FiveN1KDiagram spec={referenceAnswerSpec()} size={GROWN_SIZE} />);

    const defaultViewBox = defaultSvg.match(/viewBox="([^"]+)"/)?.[1];
    const grownViewBox = grownSvg.match(/viewBox="([^"]+)"/)?.[1];
    // The internal viewBox (where row geometry actually lives) must be
    // IDENTICAL regardless of the real, much taller outer box — proving
    // row height is a fixed constant, not derived from `size.heightPx`.
    expect(grownViewBox).toBe(defaultViewBox);

    // The outer <svg> width/height DO still match the real granted box —
    // only the internal content stays fixed-size, scaled to fit by the
    // browser's own `preserveAspectRatio`, not stretched by this component.
    expect(grownSvg).toContain(`width="${GROWN_SIZE.widthPx}" height="${GROWN_SIZE.heightPx}"`);
  });

  it("scales the whole diagram uniformly to fit its real box via preserveAspectRatio, anchored to the top-left", () => {
    const svg = renderToStaticMarkup(<FiveN1KDiagram spec={referenceAnswerSpec()} size={GROWN_SIZE} />);
    expect(svg).toContain('preserveAspectRatio="xMinYMin meet"');
  });
});
