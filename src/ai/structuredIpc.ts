import { invoke } from "@tauri-apps/api/core";
import type { ResolvedRedactionPolicy } from "./redaction";

/**
 * J1/SPEC.md §8.7: `prompt` is the already-assembled logical prompt (prompt
 * file body + the user's own data); `schema` is a JSON Schema object, built
 * by the caller via `z.toJSONSchema()` — this module never touches Zod
 * itself, matching `completionIpc.ts`'s posture of being a thin IPC wrapper
 * with no domain knowledge. The returned value is raw, unvalidated JSON —
 * the caller is responsible for validating it against the real Zod schema
 * (§8.7's own contract: Rust only carries the schema, never interprets it).
 *
 * `Capabilities`/`ai_capabilities` (`src-tauri/src/ai/{provider,commands}.rs`)
 * exist on the Rust side per SPEC.md §8.2's trait shape, but have no TS
 * caller this dilim — `EntryProposalField` always uses this prompt-
 * engineering path regardless of `capabilities().jsonSchema`, since Vorion
 * is the only adapter and it never reports `true` (§2.1's own finding). No
 * TS wrapper is added for a command nothing calls yet.
 *
 * J2/D-205/§8.11: `redaction` always crosses explicitly (never omitted) —
 * masking and un-masking both happen inside this one Rust call
 * (`VorionProvider::complete_structured`), so TS never sees either the
 * masked prompt or a raw token map; it only ever sees the final,
 * already-unredacted response.
 *
 * Faz 10/K4/§2.1: `projectId`/`promptVersion` are new — Rust has no ambient
 * notion of "the currently open project," so `ai::usage`'s per-project log
 * sidecar needs the id passed explicitly. This is the one, unavoidable
 * consequence of keeping token/cost metadata entirely inside Rust (Barış's
 * chosen plumbing, §2.1 of `K4-maliyet-sayaci.md`): the return type here is
 * unchanged (`Promise<unknown>`), so every caller built on this function
 * (K1/K2/K3's `attemptStructuredProposal` chain) needs only thread these two
 * new inputs through, never adapt to a new output shape.
 */
export function completeStructured(
  prompt: string,
  schema: object,
  modelId: string,
  redaction: ResolvedRedactionPolicy,
  projectId: string,
  promptVersion: string | null,
): Promise<unknown> {
  return invoke<unknown>("ai_complete_structured", {
    prompt,
    schema,
    modelId,
    redaction,
    projectId,
    promptVersion,
  });
}
