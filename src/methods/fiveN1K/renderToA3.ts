import type { A3BlockContent, A3ContentZone, A3EntrySummary, A3Language } from "../../a3/methodContract";
import { resolveA3Language } from "../../a3/methodContract";
import type { FiveN1KPayload } from "./schema";

/**
 * TEMPLATE_ANALYSIS.md §14.2: six equal zones (D-102's zones mechanism —
 * `smartTarget` was the first user, this is the second), one per 5N1K
 * question, in `5N-1K.jpeg`'s own order. Each zone's first line is the bold
 * question label. No room for the entry title in this strip's 4-row canvas —
 * every row is already spoken for by the six questions themselves, matching
 * the reference image, which carries no separate heading either.
 *
 * D-224 (Faz 11/L1): `zonesRowSpan: 4` is the one deliberate change to this
 * shipped file — without it, this zoned entry would silently consume the
 * *whole* remaining block (Phase 5/D-38's original one-zoned-entry-per-block
 * assumption), dropping whichever other Step 1 entry (`gapStatement` in
 * `pps-8step-auto`'s ADIM 1, but also any Step 1 entry under
 * `farplas-7step-tr` today) happened to be ordered after it — see
 * `place.ts`'s own fix note. Layer B's colour chip (§14.1) is applied here
 * too, via `fillStyleId` on each label line — this *does* update the
 * originally-written comment ("renderToA3 never writes a colour"), which
 * turned out to assume a fixed-position static template cell that the real
 * `place.ts`/`placeZones.ts` mechanism can't guarantee once an entry's
 * order is user-controlled; `fillStyleId` degrades gracefully (no colour
 * at all) on a template that doesn't define these ids, same as
 * `farplas-7step-tr` did before this dilim added them there too.
 */
const ZONE_WIDTH_FRACTION = 1 / 6;
const ZONES_ROW_SPAN = 4;

/** D-188/P-26: matches `methods.fiveN1K.fields.*`'s own editor translations, all-caps with "?" to match the reference image's own style. */
const FIELD_ORDER = [
  ["ne", { tr: "NE?", en: "WHAT?" }, "fiveN1kNe"],
  ["neden", { tr: "NEDEN?", en: "WHY?" }, "fiveN1kNeden"],
  ["nasil", { tr: "NASIL?", en: "HOW?" }, "fiveN1kNasil"],
  ["kim", { tr: "KİM?", en: "WHO?" }, "fiveN1kKim"],
  ["neZaman", { tr: "NE ZAMAN?", en: "WHEN?" }, "fiveN1kNeZaman"],
  ["nerede", { tr: "NEREDE?", en: "WHERE?" }, "fiveN1kNerede"],
] as const satisfies readonly (readonly [keyof FiveN1KPayload, Readonly<Record<A3Language, string>>, string])[];

/**
 * Keeps the same two-parameter shape as every other `renderToA3`
 * (`MethodPlugin`'s own signature) even though this strip's 4-row canvas
 * has no room for the entry title, unlike every other method's block.
 */
export function renderFiveN1KToA3(payload: FiveN1KPayload, entry: A3EntrySummary): A3BlockContent {
  const language = resolveA3Language(entry);
  const zones: A3ContentZone[] = FIELD_ORDER.map(([key, label, fillStyleId]) => {
    const answer = payload[key].trim();
    const text = label[language];
    return {
      widthFraction: ZONE_WIDTH_FRACTION,
      lines:
        answer.length > 0
          ? [{ text, bold: true, fillStyleId }, { text: answer }]
          : [{ text, bold: true, fillStyleId }],
    };
  });

  return { lines: [], zones, zonesRowSpan: ZONES_ROW_SPAN };
}
