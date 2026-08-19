import { z } from "zod";

/**
 * SPEC.md §1.3 (Step 7): "Verdict: target met / partially met / not met →
 * if not met, 'Return to Step 4' loop." `verdict` stays a plain string, not
 * `z.enum`, same reasoning as `countermeasure/schema.ts`'s `status`. Loose
 * per D-51.
 *
 * D-149(6d): the "Return to Step 4" loop itself is a manual "Yeni analiz
 * turu başlat" control (`RoundsBand`, project-level, not this payload) —
 * Phase 7's readiness/gate system (D-85) is what would ever make this field
 * *drive* navigation automatically, and that system doesn't exist yet.
 */
export const ResultVerdictPayloadSchema = z.looseObject({
  verdict: z.string(),
  notes: z.string(),
});

export type ResultVerdictPayload = z.infer<typeof ResultVerdictPayloadSchema>;
