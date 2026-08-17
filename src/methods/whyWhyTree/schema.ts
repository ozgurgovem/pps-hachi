import { z } from "zod";

/**
 * D-176/P-35: the real, signed EK-2905 ADIM 4 panel marks every leaf of the
 * tree ✓ "already controlled" or ❌+KN{N} "confirmed root cause" — the KN
 * number itself is never stored (see `outcome.ts`'s `confirmedRootCauseNumbers`,
 * D-71's "two representations, no precedence rule" trap). A loose string, not
 * `z.enum` — same reasoning as D-116's `role` and `countermeasure`'s `status`:
 * a later build's third outcome value must still round-trip without a schema
 * migration. `undefined` means "not yet decided," neither ✓ nor ❌.
 */
export const WHY_WHY_OUTCOMES = ["controlled", "confirmedRootCause"] as const;
export type WhyWhyOutcome = (typeof WHY_WHY_OUTCOMES)[number];

/**
 * SPEC.md §1.3 (Step 4): Why-Why logic tree — the *branching* sibling of
 * Phase 5's linear `fiveWhy`. A "why" with two credible answers is the case
 * a linear chain cannot express, and forcing it into one chain is how a real
 * cause gets dropped.
 *
 * Flat node list with `parentId`, per `shared/nodeTree.ts`. Loose per D-51.
 */
export const WhyWhyNodeSchema = z.looseObject({
  id: z.string(),
  parentId: z.string().nullable(),
  text: z.string(),
  outcome: z.string().optional(),
});

export const WhyWhyTreePayloadSchema = z.looseObject({
  nodes: z.array(WhyWhyNodeSchema),
});

export type WhyWhyNode = z.infer<typeof WhyWhyNodeSchema>;
export type WhyWhyTreePayload = z.infer<typeof WhyWhyTreePayloadSchema>;
