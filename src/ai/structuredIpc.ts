import { invoke } from "@tauri-apps/api/core";

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
 */
export function completeStructured(prompt: string, schema: object, modelId: string): Promise<unknown> {
  return invoke<unknown>("ai_complete_structured", { prompt, schema, modelId });
}
