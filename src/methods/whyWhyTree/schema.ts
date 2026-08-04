import { z } from "zod";

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
});

export const WhyWhyTreePayloadSchema = z.looseObject({
  nodes: z.array(WhyWhyNodeSchema),
});

export type WhyWhyNode = z.infer<typeof WhyWhyNodeSchema>;
export type WhyWhyTreePayload = z.infer<typeof WhyWhyTreePayloadSchema>;
