import { z, type ZodType } from "zod";
import { completeStructured } from "../../../ai/structuredIpc";
import { errorMessage } from "../launch/errorMessage";

/**
 * J1/SPEC.md §8.7: the pure retry-and-validate orchestration behind
 * `EntryProposalField`, split out the same way `traceability.ts` was split
 * from `TraceabilityView.tsx` (G2) — "the logic must stay testable as a
 * pure function," here meaning testable with a mocked `completeStructured`
 * rather than a mocked Tauri runtime and a rendered component.
 */

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

type Attempt =
  | { readonly success: true; readonly value: unknown }
  | { readonly success: false; readonly rawText: string; readonly errorSummary: string };

async function attemptStructuredProposal(
  prompt: string,
  jsonSchema: object,
  modelId: string,
  zodSchema: ZodType<unknown>,
): Promise<Attempt> {
  let raw: unknown;
  try {
    raw = await completeStructured(prompt, jsonSchema, modelId);
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
  const first = await attemptStructuredProposal(firstPrompt, jsonSchema, params.modelId, params.zodSchema);
  if (first.success) {
    return { outcome: "success", value: first.value };
  }

  const retryPrompt = buildRetryPrompt(params.promptBody, params.userInput, first.rawText, first.errorSummary);
  const second = await attemptStructuredProposal(retryPrompt, jsonSchema, params.modelId, params.zodSchema);
  if (second.success) {
    return { outcome: "success", value: second.value };
  }

  return { outcome: "failed", rawText: second.rawText };
}
