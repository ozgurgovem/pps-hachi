import type { A3BlockContent, A3EntrySummary, A3Language } from "../../a3/methodContract";
import { resolveA3Language } from "../../a3/methodContract";
import type { SmartTargetPayload } from "./schema";

/** D-38: prioritised items / chart / mono commitment line, in that order. */
const ZONE_A_WIDTH_FRACTION = 0.32;
const ZONE_B_WIDTH_FRACTION = 0.4;
const ZONE_C_WIDTH_FRACTION = 0.28;

/** D-188/P-26: matches `methods.smartTarget.{baselineLabel,targetLabel,unitLabel,dueDateLabel,ownerLabel}`'s own editor translations. */
const BASELINE_LABEL: Readonly<Record<A3Language, string>> = { tr: "Başlangıç", en: "Baseline" };
const TARGET_LABEL: Readonly<Record<A3Language, string>> = { tr: "Hedef", en: "Target" };
const UNIT_LABEL: Readonly<Record<A3Language, string>> = { tr: "Birim", en: "Unit" };
const DUE_LABEL: Readonly<Record<A3Language, string>> = { tr: "Bitiş", en: "Due" };
const OWNER_LABEL: Readonly<Record<A3Language, string>> = { tr: "Sorumlu", en: "Owner" };

function commitmentLine(payload: SmartTargetPayload, language: A3Language): string {
  return (
    `${BASELINE_LABEL[language]}: ${payload.baseline} · ${TARGET_LABEL[language]}: ${payload.target} · ` +
    `${UNIT_LABEL[language]}: ${payload.unit} · ${DUE_LABEL[language]}: ${payload.dueDate} · ` +
    `${OWNER_LABEL[language]}: ${payload.owner}`
  );
}

/**
 * D-38: Step 3's three-zone horizontal strip. Uses `A3BlockContent.zones`
 * (D-102) rather than `lines` — the SMART Target card is this phase's one
 * user of the horizontal-zone layout mode, but the mechanism itself is
 * generic (`placeZones.ts`), not hardcoded to this method or to Step 3.
 */
export function renderSmartTargetToA3(payload: SmartTargetPayload, entry: A3EntrySummary): A3BlockContent {
  const language = resolveA3Language(entry);
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
            baseline: { label: BASELINE_LABEL[language], value: payload.baseline },
            target: { label: TARGET_LABEL[language], value: payload.target },
          },
        },
      },
      {
        widthFraction: ZONE_C_WIDTH_FRACTION,
        lines: [{ text: commitmentLine(payload, language) }],
      },
    ],
  };
}
