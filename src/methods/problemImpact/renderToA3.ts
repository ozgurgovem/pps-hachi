import type { A3BlockContent, A3EntrySummary } from "../../a3/methodContract";
import { fieldFormLines } from "../shared/fieldForm";
import { PROBLEM_IMPACT_FIELDS } from "./fields";
import type { ProblemImpactPayload } from "./schema";

/** Mirrors `pareto/renderToA3.ts`'s own `CHART_ROW_SPAN` — same chart, same budget. */
const CHART_ROW_SPAN = 10;

/**
 * TEMPLATE_ANALYSIS.md §14.2 item 5: title + the financial-loss form's
 * labelled lines, then the Pareto chart below (D-102's `place.ts` always
 * places `lines` before `image` — the same vertical order `pareto`'s own
 * `renderToA3` uses). Requests the already-registered `pareto-chart`
 * `A3ImageKind` directly rather than redeclaring `imageKind`/`renderImage`
 * on this plugin — `paretoMethod` already supplies that renderer, and a
 * second registration for the same kind would be dead weight (D-163's own
 * "aynen yeniden kullanılır" instruction, applied literally).
 */
export function renderProblemImpactToA3(payload: ProblemImpactPayload, entry: A3EntrySummary): A3BlockContent {
  return {
    lines: [{ text: entry.title, bold: true }, ...fieldFormLines(payload, PROBLEM_IMPACT_FIELDS)],
    image: {
      kind: "pareto-chart",
      rowSpan: CHART_ROW_SPAN,
      spec: {
        kind: "pareto",
        unit: payload.unit,
        items: payload.categories.map((category) => ({ label: category.label, count: category.count })),
      },
    },
  };
}
