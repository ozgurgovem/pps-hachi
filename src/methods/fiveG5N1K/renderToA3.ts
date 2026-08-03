import type { A3BlockContent, A3EntrySummary, A3TextLine } from "../../a3/methodContract";
import type { FiveG5N1KPayload } from "./schema";

/**
 * A literal tuple, not `Object.keys(...)`: `FiveG5N1KPayload` is inferred
 * from a `z.looseObject` (D-51), which widens `keyof` to `string` via its
 * passthrough index signature — indexing with that widened `string` would
 * type `payload[key]` as `unknown`, not the named field's `string`.
 */
const FIELD_ORDER = [
  ["gemba", "Gemba"],
  ["gembutsu", "Gembutsu"],
  ["genjitsu", "Genjitsu"],
  ["genri", "Genri"],
  ["gensoku", "Gensoku"],
  ["ne", "Ne"],
  ["nerede", "Nerede"],
  ["nasil", "Nasıl"],
  ["neZaman", "Ne zaman"],
  ["neKadar", "Ne kadar"],
  ["kim", "Kim"],
] as const satisfies readonly (readonly [keyof FiveG5N1KPayload, string])[];

export function renderFiveG5N1KToA3(payload: FiveG5N1KPayload, entry: A3EntrySummary): A3BlockContent {
  const fieldLines: A3TextLine[] = FIELD_ORDER.filter(([key]) => payload[key].trim().length > 0).map(
    ([key, label]) => ({ text: `${label}: ${payload[key]}` }),
  );

  return {
    lines: [{ text: entry.title, bold: true }, ...fieldLines],
  };
}
