import type { A3BlockContent, A3EntrySummary, A3Language } from "../../a3/methodContract";
import { resolveA3Language } from "../../a3/methodContract";
import type { KpiStripPayload } from "./schema";

/** D-188/P-26: matches `methods.kpiStrip.fields.{sustain,result}`'s own editor translations, abbreviated to a bare word for the chart's footer legend. */
const SUSTAIN_LABEL: Readonly<Record<A3Language, string>> = { tr: "Sürdürme", en: "Sustain" };
const RESULT_LABEL: Readonly<Record<A3Language, string>> = { tr: "Sonuç", en: "Result" };

/**
 * Conservative row-span (TEMPLATE_ANALYSIS.md §14.3, DECISIONS.md D-167).
 * The *currently shipped* `farplas-7step-tr` ADIM 7 block (P37:AB54) has 18
 * rows to spare, but the future Rev00-based 8-step template's own ADIM 7
 * canvas is only 78 pt / 6 rows (§12.4, D-156) — unlike Pareto/Trend's
 * `CHART_ROW_SPAN = 10`, requesting that much here would fit today and
 * silently break the moment Phase 11 switches the default template. Staying
 * at the narrower template's own ceiling means nothing here has to change
 * when that happens; D-100's overflow guarantee already sends any entry
 * that still doesn't fit to the appendix rather than truncating it.
 */
const CHART_ROW_SPAN = 6;

export function renderKpiStripToA3(payload: KpiStripPayload, entry: A3EntrySummary): A3BlockContent {
  const language = resolveA3Language(entry);
  return {
    lines: [{ text: entry.title, bold: true }],
    image: {
      kind: "kpi-strip",
      rowSpan: CHART_ROW_SPAN,
      spec: {
        kind: "kpi-strip",
        items: payload.items.map((item) => ({
          label: item.label,
          unit: item.unit || undefined,
          baseline: item.baseline,
          target: item.target,
          actual: item.actual,
          sustain: item.sustain,
          result: item.result,
          status: item.status,
        })),
        sustainLabel: SUSTAIN_LABEL[language],
        resultLabel: RESULT_LABEL[language],
        language,
      },
    },
  };
}
