import type { RedactionMode, RedactionPolicy } from "../domain/model";

/**
 * J2/D-205: `RedactionPolicySchema`'s fields are all optional (so a pre-J2
 * `redaction: {}` fixture keeps parsing unchanged) — this is where "unset"
 * actually becomes a real default, mirroring `resolveA3Language`/
 * `resolveA3Images` (`src/a3/methodContract.ts`)'s own "optional schema
 * field + resolve helper" split.
 */
export interface ResolvedRedactionPolicy {
  readonly mode: RedactionMode;
  readonly terms: readonly string[];
  readonly preserveNumbers: true;
}

export function resolveRedactionPolicy(policy: RedactionPolicy | undefined): ResolvedRedactionPolicy {
  return {
    mode: policy?.mode ?? "off",
    terms: policy?.terms ?? [],
    preserveNumbers: true,
  };
}
