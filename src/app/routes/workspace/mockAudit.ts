import { z } from "zod";
import type { A3EntryRendererMap } from "../../../a3/methodContract";
import { STEP_IDS, StepIdSchema, type ProjectModel } from "../../../domain/model";
import type { ResolvedRedactionPolicy } from "../../../ai/redaction";
import { proposeStructuredEntry } from "./entryProposal";
import { summarizeEntryForAi } from "./entrySummary";

/**
 * Faz 10/K2/SPEC.md §8.6 (Review mode) + §8.10 point 4: the mock-auditor
 * findings list. Unlike K1's `layoutReview.ts`, a finding never writes
 * anything to `ProjectModel` (§2.1 — SPEC's own wording is "flags... lists
 * what would be questioned," never "writes" or "proposes"), so there is no
 * diff schema, no Accept/Reject, and no protected-token check — only a plain
 * schema-validated list, read-only, the same trivial satisfaction of D-15
 * `ReadinessAdvisory` already established one layer over.
 */
export const MockAuditFindingSchema = z.object({
  stepId: StepIdSchema,
  severity: z.enum(["minor", "major"]),
  category: z.string(),
  message: z.string(),
});
export type MockAuditFinding = z.infer<typeof MockAuditFindingSchema>;

export const MockAuditResultSchema = z.object({
  findings: z.array(MockAuditFindingSchema),
});
export type MockAuditResult = z.infer<typeof MockAuditResultSchema>;

/** Same §8.14 discipline as K1's `layoutReview.ts` — a generous character budget, not a token count. */
const MAX_CONTEXT_CHARS = 20000;

export interface MockAuditContext {
  readonly contextText: string;
  /** §8.14: never silently truncate — empty when nothing needed to shrink. */
  readonly droppedNotes: readonly string[];
}

/**
 * §2.6: K2's own, smaller context builder — reuses `summarizeEntryForAi`
 * (shared with K1) for the per-entry line, but none of `buildLayoutReviewContext`'s
 * budget/condensable-field sections, which are K1-specific and irrelevant
 * here. Deliberately a separate function rather than a further split of
 * `buildLayoutReviewContext` itself (§2.6's own "(b) is lower-risk" option) —
 * K1's already-tested context builder stays untouched beyond the one shared
 * extraction.
 */
export function buildMockAuditContext(project: ProjectModel, rendererMap: A3EntryRendererMap): MockAuditContext {
  interface EntryLine {
    readonly stepId: number;
    readonly entryId: string;
    readonly methodId: string;
    readonly visibility: string;
    readonly hasChart: boolean;
    readonly summary: string;
  }

  const lines: EntryLine[] = [];
  for (const stepId of STEP_IDS) {
    const step = project.steps[stepId];
    if (!step) {
      continue;
    }
    for (const entry of step.entries) {
      const { summary, hasChart } = summarizeEntryForAi(entry, project.meta.language, rendererMap);
      lines.push({
        stepId,
        entryId: entry.id,
        methodId: entry.methodId,
        visibility: entry.a3Visibility,
        hasChart,
        summary,
      });
    }
  }

  function formatLine(line: EntryLine, summaryMax: number): string {
    const summary = line.summary.length > summaryMax ? `${line.summary.slice(0, summaryMax)}…` : line.summary;
    return (
      `Step ${line.stepId} — entryId "${line.entryId}" (method: ${line.methodId}, ` +
      `visibility: ${line.visibility}${line.hasChart ? ", has chart" : ""}): ${summary}`
    );
  }

  const MAX_SUMMARY_CHARS = 400;
  const droppedNotes: string[] = [];

  let contextText = lines.map((line) => formatLine(line, MAX_SUMMARY_CHARS)).join("\n") || "(no entries yet)";

  // §8.14, tier 1: a `hidden` entry contributes nothing to a narrative-break
  // judgment beyond "it exists and is hidden" — drop its content summary
  // first, the least costly thing to lose.
  if (contextText.length > MAX_CONTEXT_CHARS) {
    const hiddenCount = lines.filter((line) => line.visibility === "hidden").length;
    if (hiddenCount > 0) {
      contextText = lines
        .map((line) =>
          line.visibility === "hidden"
            ? `Step ${line.stepId} — entryId "${line.entryId}" (method: ${line.methodId}, visibility: hidden)`
            : formatLine(line, MAX_SUMMARY_CHARS),
        )
        .join("\n");
      droppedNotes.push(
        `${hiddenCount} hidden entr${hiddenCount === 1 ? "y's" : "ies'"} content summaries were dropped to fit the AI's context window — only their step and method were kept.`,
      );
    }
  }

  // §8.14, tier 2 (last resort): hard-truncate, always with a visible note.
  if (contextText.length > MAX_CONTEXT_CHARS) {
    contextText = contextText.slice(0, MAX_CONTEXT_CHARS);
    droppedNotes.push(
      "This project is large enough that some content was cut off entirely before sending it to the AI — the findings below may be incomplete.",
    );
  }

  return { contextText, droppedNotes };
}

export type MockAuditOutcome =
  | { readonly outcome: "success"; readonly findings: readonly MockAuditFinding[] }
  | { readonly outcome: "failed"; readonly rawText: string };

export interface ProposeMockAuditParams {
  readonly promptBody: string;
  readonly contextText: string;
  readonly modelId: string;
  readonly redaction: ResolvedRedactionPolicy;
  readonly projectId: string;
  readonly promptVersion: string | null;
}

/**
 * §1 point 8's own suspicion, confirmed: unlike K1's `proposeLayoutReviewDiff`,
 * there is no protected-token concern for a read-only findings list, so
 * `proposeStructuredEntry`'s own schema-only retry-once (§8.7, D-204) is
 * directly sufficient — no combined-retry wrapper needed.
 */
export async function proposeMockAuditFindings(params: ProposeMockAuditParams): Promise<MockAuditOutcome> {
  const result = await proposeStructuredEntry({
    promptBody: params.promptBody,
    userInput: params.contextText,
    modelId: params.modelId,
    zodSchema: MockAuditResultSchema,
    redaction: params.redaction,
    projectId: params.projectId,
    promptVersion: params.promptVersion,
  });
  if (result.outcome === "failed") {
    return { outcome: "failed", rawText: result.rawText };
  }
  const parsed = result.value as MockAuditResult;
  return { outcome: "success", findings: parsed.findings };
}
