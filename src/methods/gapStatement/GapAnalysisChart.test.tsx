import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { GapAnalysisChart } from "./GapAnalysisChart";
import { minImageFontPx } from "../../a3/readability";
import type { GapAnalysisChartSpec } from "../chartSpec";

const PT_TO_PX = 96 / 72;
/** pps-8step-auto's real ADIM 1 side-by-side geometry (283.5×156pt) — the same size `renderToA3.ts` actually requests. */
const REAL_SIZE = { widthPx: 283.5 * PT_TO_PX, heightPx: 156 * PT_TO_PX };

function realSpec(): GapAnalysisChartSpec {
  return {
    kind: "gap-analysis",
    title: "GAP ANALİZİ",
    unit: "%",
    actualValue: 16.4,
    idealValue: 3,
    actualBarLabel: "Mevcut Durum",
    idealBarLabel: "İdeal Durum",
    actualDate: "01.08.2026",
    idealDate: "04.10.2026",
    deviationLabel: "Hedeften Sapma",
    // Real band texts (what `renderGapStatementToA3` actually produces),
    // not short placeholders — short bands let `layoutGapBands` pick a
    // narrow chart width with lots of unused margin around it, which
    // masks a too-small label zone instead of exercising it (found the
    // hard way: an earlier version of this fixture didn't go RED under
    // an injected `LABEL_ZONE_WIDTH_PX` regression).
    bandTexts: [
      "İdeal Durum: Maksimum fire oranı %3'ün altında olmalı",
      "Mevcut Durum: Ortalama fire oranı %16,4",
      "Problem Tanımı: İdeal durum ile mevcut durum arasında %13,4'lük bir sapma bulunmaktadır.",
    ],
  };
}

/**
 * Real-app follow-up (2026-09-17, Barış's own annotated screenshot): the
 * deviation bracket's own vertical arrow used to sit at the IDEAL bar's
 * horizontal centre — the exact same x as that bar's own value label — so
 * the arrowhead visually covered the "3%" text. The bracket now stays in
 * the empty gap between the two bars, never sharing an x-coordinate with
 * either bar's own value label.
 */
describe("GapAnalysisChart — deviation bracket never overlaps a bar's own value label (2026-09-17 follow-up)", () => {
  it("places the bracket's vertical line at a different x than either bar's value-label text", () => {
    const svg = renderToStaticMarkup(<GapAnalysisChart spec={realSpec()} size={REAL_SIZE} />);

    // The bracket's vertical line is the one whose x1 === x2 (excluding the axis line at the far left).
    const verticalLines = [...svg.matchAll(/<line x1="([\d.]+)" y1="[\d.]+" x2="([\d.]+)" y2="[\d.]+"/g)].filter(
      ([, x1, x2]) => x1 === x2,
    );
    const bracketLine = verticalLines[verticalLines.length - 1];
    expect(bracketLine).toBeDefined();
    const bracketX = Number(bracketLine![1]);

    // Both bars' own value-label text elements — white, bold, inside
    // whichever bar (round 5: font-size is now dynamic per bar height,
    // so matched by fill/weight instead of a fixed font-size).
    const valueLabelXs = [...svg.matchAll(/<text x="([\d.]+)" y="[\d.]+" font-size="[\d.]+" font-weight="700" fill="#FFFFFF"/g)].map(
      (m) => Number(m[1]),
    );
    expect(valueLabelXs.length).toBeGreaterThanOrEqual(2);
    for (const labelX of valueLabelXs) {
      expect(Math.abs(bracketX - labelX)).toBeGreaterThan(20);
    }
  });

  it("renders a smaller, proportional arrow marker (not the old fixed 8x8 box)", () => {
    const svg = renderToStaticMarkup(<GapAnalysisChart spec={realSpec()} size={REAL_SIZE} />);
    // Round 7: Barış's own "%50 küçült" (shrink by 50%) on round 5's 3×3.
    expect(svg).toContain('markerWidth="1.5"');
    expect(svg).toContain('markerHeight="1.5"');
  });
});

/**
 * Round 3 follow-up (2026-09-17, Barış's own mid-review mockup): a real
 * Y-axis, in-bar value labels, and the deviation bridge routed past both
 * bars into a reserved label zone — instead of squeezed into the narrow
 * gap between them (round 2) or a corner badge (never shipped, round 2's
 * own alternative). These lock in the mockup's own real design.
 */
describe("GapAnalysisChart — round 3: real axis, in-bar values, bridge routed past the bars", () => {
  it("keeps the deviation label fully inside the image's own declared width", () => {
    const svg = renderToStaticMarkup(<GapAnalysisChart spec={realSpec()} size={REAL_SIZE} />);
    // Font size is now the readability floor, not a literal — match any size.
    const labelMatch = svg.match(/<text x="([\d.]+)" y="[\d.]+" font-size="[\d.]+" text-anchor="start"[^>]*>Hedeften Sapma/);
    expect(labelMatch).toBeDefined();
    const labelX = Number(labelMatch![1]);
    // "Hedeften Sapma" at 9.5px needs real room to its right — this is
    // the exact overflow round 2's cramped placement risked.
    expect(labelX).toBeLessThan(REAL_SIZE.widthPx - 70);
  });

  it("draws real Y-axis gridlines with a 0-value tick", () => {
    const svg = renderToStaticMarkup(<GapAnalysisChart spec={realSpec()} size={REAL_SIZE} />);
    expect(svg).toContain(">0%</text>");
    expect((svg.match(/stroke="#EEECE4"/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });

  it("places a tall bar's own value label INSIDE the bar (white text)", () => {
    const svg = renderToStaticMarkup(<GapAnalysisChart spec={{ ...realSpec(), actualValue: 16.4, idealValue: 3 }} size={REAL_SIZE} />);
    const actualLabel = svg.match(/<text x="[\d.]+" y="[\d.]+" font-size="[\d.]+" font-weight="700" fill="(#[0-9A-F]+)" text-anchor="middle">16\.4/);
    expect(actualLabel?.[1]).toBe("#FFFFFF");
  });

  /**
   * Round 4 follow-up (2026-09-17, Barış's own direct correction): a SHORT
   * bar (the İdeal one, a real common case) still gets its value INSIDE,
   * near its own top — round 3's "above the bar" fallback for a short bar
   * silently reproduced the exact layout Barış's own mockup was replacing.
   *
   * Round 5 shrunk the font instead (down to a 7px floor) so a short bar
   * still kept its value inside — but round 7 found that read as
   * illegibly tiny. Round 7 follow-up (Barış's own direct correction:
   * "too tiny — if it doesn't fit, put it above instead"): below a real
   * readability floor, the value now moves ABOVE the bar, at a full,
   * legible 12px — round 3's original fallback, reinstated as an
   * explicit choice this time, not a guess.
   */
  it("moves a genuinely SHORT bar's own value ABOVE the bar (bar's own colour, full-size font) once it can't fit legibly inside", () => {
    const svg = renderToStaticMarkup(<GapAnalysisChart spec={{ ...realSpec(), actualValue: 16.4, idealValue: 3 }} size={REAL_SIZE} />);
    const idealLabel = svg.match(/<text x="[\d.]+" y="([\d.]+)" font-size="([\d.]+)" font-weight="700" fill="(#[0-9A-F]+)" text-anchor="middle">3/);
    expect(idealLabel?.[3]).toBe("#2E7D32");
    // Full-size, not shrunk: `INSIDE_FONT_PX` is now driven by the printed
    // 10pt readability floor (`src/a3/readability.ts`) rather than a literal
    // 12, so assert it is at or above that floor instead of a fixed number.
    expect(Number(idealLabel?.[2])).toBeGreaterThanOrEqual(minImageFontPx());
  });
});

/**
 * Round 4 follow-up (2026-09-17, Barış's own direct correction): round 3
 * dropped the horizontal dash at the shorter bar's own height and the
 * arrowhead at the bridge's own top end — together this left the arrow
 * reading as "floating" noticeably to the right of the İdeal bar, with no
 * visual line connecting them, and "missing" its top arrowhead. Both
 * dashes and both arrowheads are back, and the bridge now anchors
 * directly to the İdeal bar's own right edge (a small, fixed gap).
 */
describe("GapAnalysisChart — round 4: bridge anchored to the bar, both dashes, both arrowheads", () => {
  it("anchors the bridge close to the İdeal bar's own right edge, not far off in open margin", () => {
    const svg = renderToStaticMarkup(<GapAnalysisChart spec={realSpec()} size={REAL_SIZE} />);
    const idealBar = svg.match(/<rect x="([\d.]+)" y="[\d.]+" width="([\d.]+)"[^>]*fill="#8FBF4F"/);
    expect(idealBar).toBeDefined();
    const idealBarRightEdge = Number(idealBar![1]) + Number(idealBar![2]);

    const verticalLines = [...svg.matchAll(/<line x1="([\d.]+)" y1="[\d.]+" x2="([\d.]+)" y2="[\d.]+"/g)].filter(
      ([, x1, x2]) => x1 === x2,
    );
    const bridgeX = Number(verticalLines[verticalLines.length - 1]![1]);

    // Close enough to read as "pointing at the bar," far from round 3's
    // ~24.65px gap with nothing bridging it.
    expect(bridgeX - idealBarRightEdge).toBeLessThan(20);
  });

  it("draws a dashed segment connecting the bridge to EACH bar's own top (no floating gap)", () => {
    const svg = renderToStaticMarkup(<GapAnalysisChart spec={realSpec()} size={REAL_SIZE} />);
    expect((svg.match(/stroke-dasharray="5 4"/g) ?? []).length).toBe(2);
  });

  it("draws an arrowhead at BOTH ends of the vertical bridge line", () => {
    const svg = renderToStaticMarkup(<GapAnalysisChart spec={realSpec()} size={REAL_SIZE} />);
    expect(svg).toContain("marker-start=");
    expect(svg).toContain("marker-end=");
  });
});

/**
 * Round 5 follow-up (2026-09-17, Barış's own direct correction): the
 * marker's `refX`/`refY` pointed at its own CENTER, not its tip — SVG
 * aligns whichever local point `refX`/`refY` names with the real line
 * endpoint, so a centre-aligned marker draws its tip visibly PAST that
 * endpoint (past the dashed bridge line the arrow should stop at).
 * `refX` now equals `markerWidth` (the tip's own local x) so the tip
 * lands exactly on the endpoint instead of overshooting it.
 */
describe("GapAnalysisChart — round 5: arrowhead tip-aligned, not centre-aligned (no overshoot past the bridge)", () => {
  it("aligns the marker's refX to its own tip (equal to markerWidth), not its centre", () => {
    const svg = renderToStaticMarkup(<GapAnalysisChart spec={realSpec()} size={REAL_SIZE} />);
    const markerMatch = svg.match(/<marker id="gapAnalysisArrow" markerWidth="([\d.]+)" markerHeight="[\d.]+" refX="([\d.]+)"/);
    expect(markerMatch).toBeDefined();
    expect(Number(markerMatch![2])).toBe(Number(markerMatch![1]));
  });
});

/**
 * 2026-09-20 real-app follow-up (Barış's own direct report on a real
 * `farplas-7step-tr` screenshot, `reference/
 * PPS_A3_EK-2905_Yüksek_Fire_Problemi_10.08.2026.xlsx` given as the
 * target size): the old `COMPACT_WIDTH_PT = 170` / `× 0.42` pair capped
 * the chart at a small, content-driven minimum regardless of how much
 * more room was actually granted — confirmed via a real `buildA3Layout`
 * run, `farplas-7step-tr`'s own Step 1 column hands this entry 636pt
 * (848px), yet the chart used to render at barely a quarter of that.
 */
describe("GapAnalysisChart — 2026-09-20 follow-up (uses most of a much wider real box, not a small fixed minimum)", () => {
  /** farplas-7step-tr's own real Step 1 side-by-side geometry for this entry (636×420pt), confirmed via a real `buildA3Layout` run. */
  const WIDE_SIZE = { widthPx: 636 * PT_TO_PX, heightPx: 420 * PT_TO_PX };

  /**
   * Deliberately SHORT band texts — `realSpec()`'s own long "Problem
   * Tanımı" band already needs a two-line-minimum width close to what this
   * follow-up grants, which would pass even under the OLD, buggy formula
   * and mask the real regression (confirmed by mutation-testing against
   * the old `COMPACT_WIDTH_PT = 170` / `× 0.42` pair — it stayed GREEN with
   * `realSpec()`, only went RED with genuinely short bands like these,
   * where nothing but the width-preference itself can be driving the
   * chosen width).
   */
  function shortBandSpec(): GapAnalysisChartSpec {
    return { ...realSpec(), bandTexts: ["İdeal: %3", "Mevcut: %16,4", "Fark: %13,4"] };
  }

  it("draws a plot area much wider than the old ~227px compact cap, not just a narrow chart centred in a big margin", () => {
    const svg = renderToStaticMarkup(<GapAnalysisChart spec={shortBandSpec()} size={WIDE_SIZE} />);
    // The axis (`#C9C6BA`) draws two lines — a vertical left border (x2 ===
    // x1) and the horizontal bottom border. The bottom border's own SPAN
    // (x2 − x1), not its raw x2, is the real read of plot width — x2 alone
    // also grows with `boxX`'s own centring offset even when the chart
    // itself stays narrow, which would mask the regression this guards.
    const axisLines = [...svg.matchAll(/<line x1="([\d.]+)" y1="[\d.]+" x2="([\d.]+)" y2="[\d.]+" stroke="#C9C6BA">/g)];
    const horizontalAxis = axisLines.find(([, x1, x2]) => x1 !== x2);
    expect(horizontalAxis).toBeDefined();
    const plotSpanPx = Number(horizontalAxis![2]) - Number(horizontalAxis![1]);
    const oldCompactCeilingPx = 170 * PT_TO_PX;
    expect(plotSpanPx).toBeGreaterThan(oldCompactCeilingPx * 1.5);
  });
});
