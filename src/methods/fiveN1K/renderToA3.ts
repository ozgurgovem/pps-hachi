import type { A3BlockContent, A3EntrySummary, A3Language } from "../../a3/methodContract";
import { resolveA3Language } from "../../a3/methodContract";
import type { FiveN1KDiagramItem, FiveN1KDiagramSpec } from "../chartSpec";
import type { FiveN1KPayload } from "./schema";

/**
 * BVVL round, ADIM 1 (2026-09-17): replaces the old six-zone table
 * (D-189/D-224) with a hub-and-petal diagram, one image instead of six
 * text cells — matching `reference/visual/5N-1K.jpeg`'s own rosette shape
 * (Barış's explicit instruction, after two rounds correcting an
 * over-flattened first attempt into a real, non-crossing circle).
 *
 * Angle order (clockwise from top, matching the reference image, NOT the
 * Editor's own left-to-right field order): ne (top), neden (upper-right),
 * nasil (lower-right — the reference's own EK-2905 workbook uses "NE
 * KADAR?" in this slot; D-181/Barış's own call keeps this app's field as
 * "NASIL?"), nerede (bottom), neZaman (lower-left), kim (upper-left).
 *
 * Round 9 (2026-09-17): the "clockwise around a hub" framing above
 * described the now-retired radial layout (round 2-5) — `FiveN1KDiagram`
 * has been a top-to-bottom row list since round 6, so this array's order
 * is now simply row 1-6, top to bottom. Colours were D-165's Layer B hex
 * values (six distinct category hues) through round 8; round 9 replaces
 * them with a real Farplas corporate design handoff's own two-brand-color
 * ladder (`reference/5N1K tablosu tasarımı.zip`'s own README — anthracite
 * ×2, `color-mix(teal-700, 72%/88% black)` ×2, red ×2, the exact hex
 * values the README computes so 17px-bold/12px-white label text keeps
 * 4.5:1 contrast on every fill) — this is a deliberate, Barış-directed
 * supersession of D-165's Layer B for THIS component specifically, not a
 * silent drift; D-165's six-hue Layer B otherwise stays LOCKED for any
 * future method that still wants it.
 */
/**
 * `as const satisfies` (not an explicit `keyof FiveN1KPayload`-typed array)
 * — D-262's own lesson: `z.looseObject`'s index signature widens
 * `keyof FiveN1KPayload` to plain `string`, which would make `payload[key]`
 * resolve to `unknown` below. `satisfies` checks compatibility without
 * widening `key`'s own literal inferred type, the same fix shape every
 * other `RowTableField`/`FieldFormField` id array in this codebase uses.
 */
const DIAGRAM_ORDER = [
  { key: "ne", label: { tr: "NE?", en: "WHAT?" }, color: "#3C3F42" },
  { key: "neden", label: { tr: "NEDEN?", en: "WHY?" }, color: "#53565A" },
  { key: "nasil", label: { tr: "NASIL?", en: "HOW?" }, color: "#064F58" },
  { key: "nerede", label: { tr: "NEREDE?", en: "WHERE?" }, color: "#077E89" },
  { key: "neZaman", label: { tr: "NE ZAMAN?", en: "WHEN?" }, color: "#B21924" },
  { key: "kim", label: { tr: "KİM?", en: "WHO?" }, color: "#C71C27" },
] as const satisfies readonly {
  readonly key: keyof FiveN1KPayload;
  readonly label: Readonly<Record<A3Language, string>>;
  readonly color: string;
}[];

const HUB_LABEL = "5N1K";
/**
 * `FiveN1KDiagram.tsx` sizes its own circle proportionally to whatever
 * height it's handed, so this constant only has to respect ADIM 1's real
 * row budget.
 *
 * Real-app regression (2026-09-17, Barış's own trial run): this was
 * originally 11, reasoned from the elastic column's *best-case* ceiling
 * (empty ADIM 2/3, verified via `buildA3Layout`) — but in Barış's real
 * project, with ordinary (non-empty) neighbours, this entry was silently
 * dropped to the appendix: invisible in the step's own live block preview,
 * with no warning shown there. Relying on elastic growth for a *second*
 * image sharing gapStatement's own block was the mistake — elastic growth
 * is real (D-158/D-160) but not guaranteed, and a dropped entry is far
 * worse than a compact one. The row-span fix that followed (4, summing
 * with `gapStatement`'s own 8 to exactly ADIM 1's default 12 rows) traded
 * that outage for real smallness — half the row height meant half the
 * diagram's own natural radius.
 *
 * ADIM 1 side-by-side round (2026-09-17): `place.ts`'s new
 * `A3BlockContent.widthFraction` mechanism lets this diagram sit next to
 * `gapStatement`'s chart instead of stacked below it — this now uses the
 * block's FULL row height while only sharing its width, still fitting
 * `farplas-7step-tr`'s legacy 14-row ADIM 1 block too.
 *
 * Real-app regression, round 7 (2026-09-17, Barış's own live block
 * preview screenshot): a fixed `rowSpan: 12` was exactly right for ADIM
 * 1's own STATIC default, but ADIM 1 also declares `elastic: {
 * minimumCanvasRows: 10 }` (Faz 11/L3a, D-158/D-160) — a near-empty
 * ADIM 2/3 lets it grow the block far past 12 rows, and this diagram
 * stayed pinned to its old fixed 12-row footprint regardless, leaving
 * the rest of a much taller live block empty (see `gapStatement/
 * renderToA3.ts`'s own matching note — the two share this exact bug).
 * `content.image.rowSpan` left OMITTED makes `place.ts` size this to
 * whatever the block's own real, post-elastic row range actually is —
 * self-bounding by construction, so it cannot reintroduce the original
 * stacked-and-dropped regression the fixed 12 was originally chosen to
 * prevent.
 *
 * Real-app regression, round 8 (2026-09-17, Barış's own live block preview
 * screenshot): an omitted `rowSpan` reports `Number.POSITIVE_INFINITY`
 * demand to the elastic solver — with ADIM 2/3 genuinely near-empty in
 * Barış's real project, ADIM 1 greedily absorbed the ENTIRE column's
 * surplus, far more than either chart's own layout needed, leaving a huge
 * blank area under two still-modest-sized images. `MAX_DEMAND_ROW_SPAN`
 * (see `gapStatement/renderToA3.ts`'s own matching note — the two share
 * this bug and this fix) caps the SOLVER's demand at a finite, deliberately
 * generous target while `rowSpan` itself stays omitted, so placement still
 * self-bounds to the block's real resolved height and can never overflow it.
 */
/**
 * Natural shape, width ÷ height: a heading over six stacked label+answer
 * rows, so it is decidedly taller than it is wide. See
 * `A3ImageRequest.aspectRatio` for why this exists.
 */
const FIVE_N1K_ASPECT = 0.8;

const MAX_DEMAND_ROW_SPAN = 24;

export function renderFiveN1KToA3(payload: FiveN1KPayload, entry: A3EntrySummary): A3BlockContent {
  const language = resolveA3Language(entry);

  const items: FiveN1KDiagramItem[] = DIAGRAM_ORDER.map(({ key, label, color }) => ({
    label: label[language],
    answer: payload[key].trim(),
    color,
  }));

  const spec: FiveN1KDiagramSpec = { kind: "five-n1k", hubLabel: HUB_LABEL, items };

  return {
    lines: [],
    image: { kind: "five-n1k-diagram", spec, maxDemandRowSpan: MAX_DEMAND_ROW_SPAN, aspectRatio: FIVE_N1K_ASPECT },
    widthFraction: 0.5,
  };
}
