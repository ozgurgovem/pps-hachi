import type { A3BlockContent, A3ContentZone, A3EntrySummary } from "../../a3/methodContract";
import type { FiveN1KPayload } from "./schema";

/**
 * TEMPLATE_ANALYSIS.md §14.2: six equal zones (D-102's zones mechanism —
 * `smartTarget` was the first user, this is the second), one per 5N1K
 * question, in `5N-1K.jpeg`'s own order. Each zone's first line is the bold
 * question label; Layer B's colour chip (§14.1) is a static template cell
 * style — `renderToA3` only ever writes the label text, never a colour.
 * No room for the entry title in this strip's 4-row canvas — every row is
 * already spoken for by the six questions themselves, matching the
 * reference image, which carries no separate heading either.
 */
const ZONE_WIDTH_FRACTION = 1 / 6;

const FIELD_ORDER = [
  ["ne", "NE?"],
  ["neden", "NEDEN?"],
  ["nasil", "NASIL?"],
  ["kim", "KİM?"],
  ["neZaman", "NE ZAMAN?"],
  ["nerede", "NEREDE?"],
] as const satisfies readonly (readonly [keyof FiveN1KPayload, string])[];

/**
 * Keeps the same two-parameter shape as every other `renderToA3`
 * (`MethodPlugin`'s own signature) even though this strip's 4-row canvas
 * has no room for the entry title, unlike every other method's block.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function renderFiveN1KToA3(payload: FiveN1KPayload, _entry: A3EntrySummary): A3BlockContent {
  const zones: A3ContentZone[] = FIELD_ORDER.map(([key, label]) => {
    const answer = payload[key].trim();
    return {
      widthFraction: ZONE_WIDTH_FRACTION,
      lines: answer.length > 0 ? [{ text: label, bold: true }, { text: answer }] : [{ text: label, bold: true }],
    };
  });

  return { lines: [], zones };
}
