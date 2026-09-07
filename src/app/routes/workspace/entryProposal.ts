import { z, type ZodType } from "zod";
import type { AttachmentPreview } from "../../../ai/ingestIpc";
import type { ResolvedRedactionPolicy } from "../../../ai/redaction";
import { completeStructured } from "../../../ai/structuredIpc";
import { errorMessage } from "../launch/errorMessage";

/**
 * J1/SPEC.md §8.7: the pure retry-and-validate orchestration behind
 * `EntryProposalField`, split out the same way `traceability.ts` was split
 * from `TraceabilityView.tsx` (G2) — "the logic must stay testable as a
 * pure function," here meaning testable with a mocked `completeStructured`
 * rather than a mocked Tauri runtime and a rendered component.
 */

/**
 * J2/D-205/§2.4: formats a confirmed attachment into the same kind of text
 * block the user could have typed by hand — the file-derived summary joins
 * `userInput` as a supplement, never a replacement, so whatever the user
 * already wrote stays intact. Deliberately plain, labelled text rather than
 * a second structured channel: `proposeStructuredEntry` has exactly one
 * `userInput` string, and giving the file its own parallel path would be a
 * second, undocumented way to reach the same prompt (P-50's own "no
 * automatic context slice consumer yet" note applies the same reasoning
 * here — one input surface, not two).
 */
export function formatIngestedTableForPrompt(preview: AttachmentPreview): string {
  const { fileName, table } = preview;
  const lines: string[] = [`Attached file: ${fileName}`, `Columns: ${table.headers.join(", ")}`];

  if (table.stratifiedBy) {
    const truncatedNote = table.truncated ? `, showing the first ${table.groupCounts.length}` : "";
    lines.push(
      `Total rows: ${table.rowCount} (stratified sample by "${table.stratifiedBy}", ${table.groupCounts.length} distinct values${truncatedNote})`,
    );
    lines.push("Group counts:");
    for (const group of table.groupCounts) {
      lines.push(`- ${group.value}: ${group.count}`);
    }
  } else {
    const truncatedNote = table.truncated ? ` (showing the first ${table.sampleRows.length})` : "";
    lines.push(`Total rows: ${table.rowCount}${truncatedNote}`);
  }

  lines.push("Sample rows:");
  for (const row of table.sampleRows) {
    lines.push(`- ${table.headers.map((header, index) => `${header}=${row[index] ?? ""}`).join(", ")}`);
  }

  return lines.join("\n");
}

export function buildProposalPrompt(promptBody: string, userInput: string): string {
  return `${promptBody}\n\n---\n\n## User-provided data\n\n${userInput}`;
}

/** §8.7: "retry once with the validation errors appended." */
export function buildRetryPrompt(
  promptBody: string,
  userInput: string,
  previousRawText: string,
  errorSummary: string,
): string {
  return `${buildProposalPrompt(promptBody, userInput)}\n\n---\n\n## Your previous attempt was invalid\n\nYour previous response:\n${previousRawText}\n\nValidation errors:\n${errorSummary}\n\nCorrect these issues and respond again with ONLY valid JSON matching the schema — no prose, no markdown code fences.`;
}

export function formatZodErrors(error: z.ZodError): string {
  return error.issues
    .map((issue) => `- ${issue.path.length > 0 ? issue.path.join(".") : "(root)"}: ${issue.message}`)
    .join("\n");
}

export type Attempt =
  | { readonly success: true; readonly value: unknown }
  | { readonly success: false; readonly rawText: string; readonly errorSummary: string };

/**
 * Exported so `layoutReview.ts` (Faz 10/K1) can build its own retry loop on
 * top of this one attempt primitive — K1's diff proposal needs a *combined*
 * single retry (schema failure OR a lost protected token both count as "the
 * attempt failed"), which doesn't fit `proposeStructuredEntry`'s own
 * schema-only retry-once below. Reusing this rather than duplicating it is
 * the whole point (Anayasa Madde 2/G2).
 *
 * Faz 10/K4: `projectId`/`promptVersion` pass straight through to
 * `completeStructured` for `ai::usage`'s per-project log — every caller of
 * this function already has both readily available (the open project's own
 * id, and the same prompt-version string it already builds for `Provenance`).
 */
export async function attemptStructuredProposal(
  prompt: string,
  jsonSchema: object,
  modelId: string,
  zodSchema: ZodType<unknown>,
  redaction: ResolvedRedactionPolicy,
  projectId: string,
  promptVersion: string | null,
): Promise<Attempt> {
  let raw: unknown;
  try {
    raw = await completeStructured(prompt, jsonSchema, modelId, redaction, projectId, promptVersion);
  } catch (error) {
    const message = errorMessage(error);
    return { success: false, rawText: message, errorSummary: message };
  }
  const parsed = zodSchema.safeParse(raw);
  if (parsed.success) {
    return { success: true, value: parsed.data };
  }
  return {
    success: false,
    rawText: JSON.stringify(raw, null, 2),
    errorSummary: formatZodErrors(parsed.error),
  };
}

export type ProposalResult =
  | { readonly outcome: "success"; readonly value: unknown }
  | { readonly outcome: "failed"; readonly rawText: string };

export interface ProposeStructuredEntryParams {
  readonly promptBody: string;
  readonly userInput: string;
  readonly modelId: string;
  readonly zodSchema: ZodType<unknown>;
  readonly redaction: ResolvedRedactionPolicy;
  readonly projectId: string;
  /** e.g. `"pareto.v1"` — the same string already written into `Provenance.model.promptVersion`. */
  readonly promptVersion: string | null;
}

/**
 * §8.7: "Validate the response against the Zod schema on return. On
 * failure, retry once with the validation errors appended; on second
 * failure, surface the raw response to the user as text and do not write
 * anything." A Rust-level failure (the model's response wasn't even valid
 * JSON, `AiError::StructuredOutputNotJson`) counts as a "failure" here too —
 * both are "the model didn't produce a valid structured proposal," and both
 * get exactly one retry.
 */
export async function proposeStructuredEntry(params: ProposeStructuredEntryParams): Promise<ProposalResult> {
  const jsonSchema = z.toJSONSchema(params.zodSchema, { target: "draft-2020-12" });

  const firstPrompt = buildProposalPrompt(params.promptBody, params.userInput);
  const first = await attemptStructuredProposal(
    firstPrompt,
    jsonSchema,
    params.modelId,
    params.zodSchema,
    params.redaction,
    params.projectId,
    params.promptVersion,
  );
  if (first.success) {
    return { outcome: "success", value: first.value };
  }

  const retryPrompt = buildRetryPrompt(params.promptBody, params.userInput, first.rawText, first.errorSummary);
  const second = await attemptStructuredProposal(
    retryPrompt,
    jsonSchema,
    params.modelId,
    params.zodSchema,
    params.redaction,
    params.projectId,
    params.promptVersion,
  );
  if (second.success) {
    return { outcome: "success", value: second.value };
  }

  return { outcome: "failed", rawText: second.rawText };
}
