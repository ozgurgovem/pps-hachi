import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { minImageFontPx, A3_MIN_PRINTED_FONT_PT } from "./readability";
import { getA3ImageRendererMap } from "../methods/registry";
import type { A3ImageSize } from "./methodContract";

/**
 * OKUNABİLİRLİK KURALININ DAVRANIŞSAL KAPISI — Barış, 2026-09-22.
 *
 * The template gate (`rev00Fidelity.test.ts`) covers text the app writes
 * into CELLS. This one covers the other half: text a chart or diagram draws
 * inside a rasterized image. It renders each registered image kind at a
 * realistically SMALL granted box — the case that actually broke, a Step 1
 * block sharing its width between two entries — and reads every `font-size`
 * the component actually emitted back out of the DOM.
 *
 * It deliberately inspects rendered output rather than source text, so a
 * component that computes a size at runtime (`readableFontPx(...)`, a
 * height-proportional label) is judged on what it really draws.
 */

/** The real granted box a side-by-side ADIM 1 entry gets on the Rev00 form: 247.5pt x 299pt. */
const SMALL_BOX: A3ImageSize = { widthPx: 330, heightPx: 399 };
/** A deliberately cramped box, to prove the floor holds when the component is squeezed rather than only when it has room. */
const TINY_BOX: A3ImageSize = { widthPx: 180, heightPx: 120 };

const FLOOR_PX = minImageFontPx();

/** One minimal-but-valid spec per registered image kind. */
const SPECS: Readonly<Record<string, unknown>> = {
  "five-n1k-diagram": {
    hubLabel: "EK-5453 Kalıbı Fire Oranı",
    items: [
      { label: "NE?", answer: "Kapı panelinde çapak", color: "#E0342A" },
      { label: "NEREDE?", answer: "Enjeksiyon Hat 3", color: "#4A90D9" },
      { label: "NE ZAMAN?", answer: "Haziran 2026", color: "#8FBF4F" },
    ],
  },
  "gap-analysis-chart": {
    title: "Fire Oranı",
    idealLabel: "Hedef",
    idealValue: 1,
    actualLabel: "Mevcut",
    actualValue: 4.2,
    unit: "%",
    deviationLabel: "Hedeften Sapma",
    deviationValue: 3.2,
    bandTexts: ["Olması gereken", "Mevcut durum", "Problem"],
    baselinePeriod: "Q2 2026",
    targetDate: "Q3 2026",
  },
};

function fontSizesIn(container: HTMLElement): number[] {
  return [...container.querySelectorAll("[font-size]")]
    .map((node) => Number.parseFloat(node.getAttribute("font-size") ?? ""))
    .filter((value) => Number.isFinite(value) && value > 0);
}

describe(`every chart/diagram draws type at or above the ${A3_MIN_PRINTED_FONT_PT}pt printed floor`, () => {
  const rendererMap = getA3ImageRendererMap();

  for (const [kind, spec] of Object.entries(SPECS)) {
    for (const [boxName, box] of [
      ["a real side-by-side ADIM 1 box", SMALL_BOX],
      ["a deliberately cramped box", TINY_BOX],
    ] as const) {
      it(`${kind}, in ${boxName}`, () => {
        const render_ = rendererMap[kind as keyof typeof rendererMap];
        expect(render_, `no renderer registered for "${kind}"`).toBeDefined();

        const { container } = render(render_!(spec as never, box));
        const sizes = fontSizesIn(container);

        expect(sizes.length, `${kind} drew no text at all — the probe spec is wrong`).toBeGreaterThan(0);
        const tooSmall = sizes.filter((size) => size < FLOOR_PX - 0.001);
        expect(
          tooSmall,
          `${kind} drew text at ${tooSmall.join(", ")}px; the floor is ${FLOOR_PX.toFixed(2)}px (= ${A3_MIN_PRINTED_FONT_PT}pt printed)`,
        ).toEqual([]);
      });
    }
  }
});
