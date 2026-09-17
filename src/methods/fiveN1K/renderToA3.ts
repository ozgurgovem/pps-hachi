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
 * Colours are D-165's Layer B hex values, drawn directly rather than
 * looked up via a template `fillStyleId` — this image no longer depends
 * on any template's own style table.
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
  { key: "ne", label: { tr: "NE?", en: "WHAT?" }, color: "#C68A2E" },
  { key: "neden", label: { tr: "NEDEN?", en: "WHY?" }, color: "#5F4470" },
  { key: "nasil", label: { tr: "NASIL?", en: "HOW?" }, color: "#2F7A6E" },
  { key: "nerede", label: { tr: "NEREDE?", en: "WHERE?" }, color: "#556677" },
  { key: "neZaman", label: { tr: "NE ZAMAN?", en: "WHEN?" }, color: "#8A5A3B" },
  { key: "kim", label: { tr: "KİM?", en: "WHO?" }, color: "#8B3A5C" },
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
 * worse than a compact one. This constant + `gapStatement/renderToA3.ts`'s
 * own `CHART_ROW_SPAN` now sum to exactly 12 — ADIM 1's own *default* row
 * count, no elastic growth needed at all — so both entries place
 * unconditionally, on any project, regardless of ADIM 2/3's own content.
 * The same total budget D-224's own `zonesRowSpan` split (4 here, 8 for
 * gapStatement) already proved reliable, before this dilim's redesign.
 * `farplas-7step-tr`'s legacy ADIM 1 block (14 rows, no elastic, D-226)
 * comfortably fits this too now.
 */
const DIAGRAM_ROW_SPAN = 4;

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
    image: { kind: "five-n1k-diagram", rowSpan: DIAGRAM_ROW_SPAN, spec },
  };
}
