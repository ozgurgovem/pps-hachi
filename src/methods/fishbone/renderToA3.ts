import type { A3BlockContent, A3EntrySummary } from "../../a3/methodContract";
import { resolveA3Language } from "../../a3/methodContract";
import type { FishboneImageSpec } from "./layout";
import type { FishbonePayload } from "./schema";

export function renderFishboneToA3(payload: FishbonePayload, entry: A3EntrySummary): A3BlockContent {
  const spec: FishboneImageSpec = { payload, effectLabel: entry.title, language: resolveA3Language(entry) };

  return {
    lines: [{ text: entry.title, bold: true }],
    image: {
      kind: "fishbone-diagram",
      // No rowSpan: fishbone is Step 4's usual single/primary entry (SPEC.md
      // §2.3) and fills whatever budget remains in the block by default.
      spec,
    },
  };
}
