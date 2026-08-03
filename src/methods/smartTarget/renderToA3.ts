import type { A3BlockContent, A3EntrySummary } from "../../a3/methodContract";
import type { SmartTargetPayload } from "./schema";

/** D-38: prioritised items / chart / mono commitment line, in that order. */
const ZONE_A_WIDTH_FRACTION = 0.32;
const ZONE_B_WIDTH_FRACTION = 0.4;
const ZONE_C_WIDTH_FRACTION = 0.28;

function commitmentLine(payload: SmartTargetPayload): string {
  return (
    `Baseline: ${payload.baseline} · Target: ${payload.target} · Unit: ${payload.unit} · ` +
    `Due: ${payload.dueDate} · Owner: ${payload.owner}`
  );
}

/**
 * D-38: Step 3's three-zone horizontal strip. Uses `A3BlockContent.zones`
 * (D-102) rather than `lines` — the SMART Target card is this phase's one
 * user of the horizontal-zone layout mode, but the mechanism itself is
 * generic (`placeZones.ts`), not hardcoded to this method or to Step 3.
 */
export function renderSmartTargetToA3(payload: SmartTargetPayload, entry: A3EntrySummary): A3BlockContent {
  return {
    lines: [],
    zones: [
      {
        widthFraction: ZONE_A_WIDTH_FRACTION,
        lines: [
          { text: entry.title },
          ...payload.prioritizedItems.map((item) => ({ text: `• ${item.text}` })),
        ],
      },
      {
        widthFraction: ZONE_B_WIDTH_FRACTION,
        image: {
          kind: "trajectory-chart",
          spec: {
            kind: "trajectory",
            unit: payload.unit,
            baseline: { label: "Baseline", value: payload.baseline },
            target: { label: "Target", value: payload.target },
          },
        },
      },
      {
        widthFraction: ZONE_C_WIDTH_FRACTION,
        lines: [{ text: commitmentLine(payload) }],
      },
    ],
  };
}
