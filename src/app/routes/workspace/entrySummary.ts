import type { A3EntryRendererMap } from "../../../a3/methodContract";
import type { Entry, ProjectModel } from "../../../domain/model";

export interface EntryAiSummary {
  readonly summary: string;
  readonly hasChart: boolean;
}

/**
 * Faz 10/K2/§2.6: extracted out of K1's `buildLayoutReviewContext` (a pure
 * relocation, no behavior change — `layoutReview.test.ts` stays green
 * unchanged) so K2's own `buildMockAuditContext` can reuse the exact same
 * "one line per entry" summarization instead of writing a second copy of it
 * (Anayasa Madde 2/G2). Reuses each method's own `renderToA3`
 * (`rendererMap`) — there is still no separate summarization mechanism.
 */
export function summarizeEntryForAi(
  entry: Entry,
  language: ProjectModel["meta"]["language"],
  rendererMap: A3EntryRendererMap,
): EntryAiSummary {
  const content = rendererMap[entry.methodId]?.(entry.payload, {
    id: entry.id,
    title: entry.title,
    language,
  });
  const hasChart = Boolean(content?.image) || Boolean(content?.zones?.some((zone) => zone.image));
  const summary = content ? content.lines.map((line) => line.text).join(" / ") : entry.title;
  return { summary, hasChart };
}
