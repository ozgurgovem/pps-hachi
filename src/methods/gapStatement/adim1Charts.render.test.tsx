import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { GapAnalysisChart } from "./GapAnalysisChart";
import { FiveN1KDiagram } from "../fiveN1K/FiveN1KDiagram";
import type { GapAnalysisChartSpec, FiveN1KDiagramSpec } from "../chartSpec";

/**
 * ADIM 1 BVVL round (2026-09-16/17): neither `xlsxSurvival.test.ts` file
 * actually invokes these two components' own render function (the images
 * they inject are pre-baked base64, bypassing rasterization entirely, the
 * same shape every other method's own survival test uses) — so this is
 * the one place either component's JSX genuinely executes. Cheap and
 * real: it would have caught D-105-class capture hazards' sibling bug,
 * a plain render-time throw, which no spec-shape test can see.
 */

describe("smoke: real render, no throw", () => {
  it("GapAnalysisChart renders valid SVG for a realistic spec and pps-8step-auto-sized box", () => {
    const spec: GapAnalysisChartSpec = {
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
      bandTexts: [
        "İdeal Durum: Maksimum fire oranı %3'ün altında olmalı",
        "Mevcut Durum: Ortalama fire oranı %16,4",
        "Problem Tanımı: İdeal durum ile mevcut durum arasında %13,4'lük bir sapma bulunmaktadır.",
      ],
    };
    const html = renderToStaticMarkup(<GapAnalysisChart spec={spec} size={{ widthPx: 756, heightPx: 190.67 }} />);
    expect(html).toContain("<svg");
    expect(html).toContain("GAP ANALİZİ");
    expect(html).toContain("Hedeften Sapma");
  });

  it("FiveN1KDiagram renders valid SVG for a realistic spec and pps-8step-auto-sized box", () => {
    const spec: FiveN1KDiagramSpec = {
      kind: "five-n1k",
      hubLabel: "5N1K",
      items: [
        { label: "NE?", answer: "Yüksek fire oranı", color: "#C68A2E" },
        { label: "NEDEN?", answer: "Enjeksiyon sapması", color: "#5F4470" },
        // Round 6 (horizontal chevron list, replacing the radial rosette):
        // this answer used to force truncation at the rosette's own tiny
        // per-satellite capacity — the list's full-width rows now render
        // it completely (round 9: since the answer panel fills the row's
        // FULL remaining width — see FiveN1KDiagram.tsx's own note — this
        // wraps at a much wider point than round 7/8's own artificially
        // narrow target), a genuine capacity improvement, not a regression.
        { label: "NASIL?", answer: "Sensör arızası ile çok uzun bir cevap metni burada yazıyor", color: "#064F58" },
        { label: "NEREDE?", answer: "T2 enjeksiyon alanı", color: "#077E89" },
        { label: "NE ZAMAN?", answer: "", color: "#B21924" },
        { label: "KİM?", answer: "Proses Mühendisliği", color: "#C71C27" },
      ],
    };
    // The real, current production size on the Rev00 form (247.5 x 299pt,
    // measured through `buildA3Layout` on 2026-09-22) — the old 378x208
    // pair came from the pre-Rev00 §12 page contract.
    const html = renderToStaticMarkup(<FiveN1KDiagram spec={spec} size={{ widthPx: 330, heightPx: 399 }} />);
    expect(html).toContain("<svg");
    expect(html).toContain("5N1K");
    // At this real size, at the printed-10pt readability floor, the answer
    // wraps across the row's two available lines — nothing is lost and no
    // ellipsis appears.
    for (const word of "Sensör arızası ile çok uzun bir cevap metni".split(" ")) {
      expect(html).toContain(word);
    }
    expect(html).not.toContain("…");
  });
});
