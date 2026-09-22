import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FiveN1KDiagram } from "./FiveN1KDiagram";
import type { FiveN1KDiagramSpec } from "../chartSpec";
import { FIVE_N1K_ANSWER_SOFT_LIMIT } from "./constants";

const PT_TO_PX = 96 / 72;
/**
 * The real granted box on the Rev00 form (measured through `buildA3Layout`,
 * 2026-09-22): ADIM 1 is 495pt wide, split in half between this diagram and
 * the gap chart, and 299pt tall once the block's own elastic growth is
 * resolved. The old 283.5 x 156 pair was the pre-Rev00 §12 contract's
 * geometry and is 2x too short, which made the readability floor look like
 * it forced truncation when in reality the box is tall enough for two
 * lines per row.
 */
const REAL_SIZE = { widthPx: 247.5 * PT_TO_PX, heightPx: 299 * PT_TO_PX };

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

  it("renders the real reference document's longest answer (41 chars) in full, with no ellipsis", () => {
    const svg = renderToStaticMarkup(<FiveN1KDiagram spec={referenceAnswerSpec()} size={REAL_SIZE} />);
    // Okunabilirlik kuralı (2026-09-22): at the printed-10pt floor this no
    // longer fits on ONE line inside a half-block ADIM 1 box, so it wraps
    // onto the row's second line. What must still hold is that nothing is
    // LOST — every word is present and no ellipsis appears.
    for (const word of "15.07.2026 Enj. Makinesi Değişikliği ile".split(" ")) {
      expect(svg).toContain(word);
    }
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

  /**
   * Okunabilirlik kuralı (2026-09-22): round 9's decorative "01".."06" row
   * index was drawn at 6px — 4.5pt printed, far under the floor. It carries
   * no information the row order does not already show, and at the floor
   * font it would not fit inside the chevron beside its own label, so it was
   * removed rather than printed illegibly. This keeps it removed.
   */
  it("draws no decorative row-number index — it could not carry the readability floor", () => {
    const svg = renderToStaticMarkup(<FiveN1KDiagram spec={referenceAnswerSpec()} size={REAL_SIZE} />);
    for (const rowNumber of ["01", "02", "03", "04", "05", "06"]) {
      expect(svg).not.toContain(`>${rowNumber}<`);
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
describe("FiveN1KDiagram — round 9 follow-up (flat-left chevron)", () => {
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
});

/**
 * 2026-09-20 real-app follow-up, attempt 2 (Barış's own direct report, a
 * real screenshot on `farplas-7step-tr`'s much wider Step 1 block, given
 * TWICE now across two consecutive rounds with zero visible change each
 * time): attempt 1 (a fixed natural `viewBox` size + `preserveAspectRatio`
 * scale-up) was correct BY ARITHMETIC — confirmed via a real `buildA3Layout`
 * run and the SVG spec's own documented "meet" formula — but produced no
 * visible change in the real app. Rather than keep trusting a mechanism
 * this project's own history (D-105, D-113) already found fragile under
 * this exact `html-to-image` capture pipeline, this attempt drops
 * `preserveAspectRatio` scaling entirely: `viewBox` now always equals
 * `size.widthPx × size.heightPx` exactly (matching `GapAnalysisChart.tsx`'s
 * own already-working pattern, G2), and row height is computed directly
 * from the real granted height, clamped between round 9's own approved
 * floor and a deliberate ceiling.
 */
describe("FiveN1KDiagram — 2026-09-20 follow-up, attempt 2 (viewBox always matches the real box exactly, no scale transform)", () => {
  /** farplas-7step-tr's own real Step 1 side-by-side geometry for this entry (758.25×420pt), confirmed via a real `buildA3Layout` run — nearly 3× `REAL_SIZE`'s own tuned width. */
  const WIDE_SIZE = { widthPx: 758.25 * PT_TO_PX, heightPx: 420 * PT_TO_PX };
  /** pps-8step-auto's own round-8 elastic-growth ceiling (24 rows/312pt) — the same size a near-empty column can hand this diagram. */
  const GROWN_SIZE = { widthPx: 283.5 * PT_TO_PX, heightPx: 24 * 13 * PT_TO_PX };

  it("sets viewBox to exactly size.widthPx × size.heightPx — no separate natural coordinate space, no preserveAspectRatio", () => {
    const svg = renderToStaticMarkup(<FiveN1KDiagram spec={referenceAnswerSpec()} size={WIDE_SIZE} />);
    expect(svg).toContain(`viewBox="0 0 ${WIDE_SIZE.widthPx} ${WIDE_SIZE.heightPx}"`);
    expect(svg).toContain(`width="${WIDE_SIZE.widthPx}" height="${WIDE_SIZE.heightPx}"`);
    expect(svg).not.toContain("preserveAspectRatio");
  });

  it("grows row height on a much wider/taller real box, well past round 9's own 27.8px default", () => {
    // Deliberately a SHORT box, not `REAL_SIZE` — the real Rev00 ADIM 1 box
    // is now tall enough to sit at the row-height ceiling already, so
    // comparing it against a bigger one would compare 55 with 55.
    const SHORT_SIZE = { widthPx: REAL_SIZE.widthPx, heightPx: 200 };
    const narrowSvg = renderToStaticMarkup(<FiveN1KDiagram spec={referenceAnswerSpec()} size={SHORT_SIZE} />);
    const wideSvg = renderToStaticMarkup(<FiveN1KDiagram spec={referenceAnswerSpec()} size={WIDE_SIZE} />);
    const narrowChevronHeight = Number(narrowSvg.match(/<polygon points="0,0 [\d.]+,0 [\d.]+,([\d.]+)/)![1]) * 2;
    const wideChevronHeight = Number(wideSvg.match(/<polygon points="0,0 [\d.]+,0 [\d.]+,([\d.]+)/)![1]) * 2;
    expect(wideChevronHeight).toBeGreaterThan(narrowChevronHeight);
  });

  it("never grows row height past the deliberate ceiling, even on a hugely over-grown block (never the old 'sparse, over-tall' rows again)", () => {
    const svg = renderToStaticMarkup(<FiveN1KDiagram spec={referenceAnswerSpec()} size={GROWN_SIZE} />);
    // Chevron height is 2× the half-height coordinate in `chevronPoints`'s own polygon string.
    const chevronHeight = Number(svg.match(/<polygon points="0,0 [\d.]+,0 [\d.]+,([\d.]+)/)![1]) * 2;
    expect(chevronHeight).toBeLessThanOrEqual(55);
  });

  it("never grows row height below round 9's own approved 27.8px floor, even on a very short real box", () => {
    const tinySize = { widthPx: 283.5 * PT_TO_PX, heightPx: 60 };
    const svg = renderToStaticMarkup(<FiveN1KDiagram spec={referenceAnswerSpec()} size={tinySize} />);
    const chevronHeight = Number(svg.match(/<polygon points="0,0 [\d.]+,0 [\d.]+,([\d.]+)/)![1]) * 2;
    expect(chevronHeight).toBeGreaterThanOrEqual(27.8);
  });
});
