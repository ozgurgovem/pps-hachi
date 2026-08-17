import type { A3BlockContent, A3EntrySummary } from "../../a3/methodContract";
import type { WhyWhyTreeImageSpec } from "./layout";
import type { WhyWhyTreePayload } from "./schema";

/**
 * D-176: TEMPLATE_ANALYSIS.md §12.5 sizes ADIM 4's block for exactly "1 grafik
 * + 1 giriş" — the same slot Fishbone already fills with no `rowSpan`. The
 * real signed EK-2905 form uses the why-why tree as Step 4's *sole* diagram,
 * never alongside Fishbone in the same block, so this mirrors Fishbone's
 * pattern (`renderFishboneToA3.ts`) rather than reserving a fixed budget.
 */
export function renderWhyWhyTreeToA3(payload: WhyWhyTreePayload, entry: A3EntrySummary): A3BlockContent {
  const spec: WhyWhyTreeImageSpec = { payload, rootLabel: entry.title };

  return {
    lines: [{ text: entry.title, bold: true }],
    image: {
      kind: "why-why-diagram",
      spec,
    },
  };
}
