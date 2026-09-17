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
        { label: "NASIL?", answer: "Sensör arızası ile çok uzun bir cevap metni burada yazıyor", color: "#2F7A6E" },
        { label: "NEREDE?", answer: "T2 enjeksiyon alanı", color: "#556677" },
        { label: "NE ZAMAN?", answer: "", color: "#8A5A3B" },
        { label: "KİM?", answer: "Proses Mühendisliği", color: "#8B3A5C" },
      ],
    };
    const html = renderToStaticMarkup(<FiveN1KDiagram spec={spec} size={{ widthPx: 756, heightPx: 143 }} />);
    expect(html).toContain("<svg");
    expect(html).toContain("5N1K");
    expect(html).toContain("…"); // the long NASIL answer must truncate
  });
});
