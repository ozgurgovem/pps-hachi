import { z } from "zod";

/**
 * Phase 3's only method plugin: a free-text entry usable in all 8 steps,
 * used to prove the entry CRUD/reorder pipeline before any real PPS method
 * (Pareto, Fishbone, 5-Why…) ships in Phase 5/6. Loose per D-51's project-wide
 * convention, even though this schema is validated at edit-time, not load
 * time (D-52) — staying consistent means a later additive field never gets
 * silently stripped by an editor round-trip either.
 */
export const GenericTextPayloadSchema = z.looseObject({
  text: z.string(),
});

export type GenericTextPayload = z.infer<typeof GenericTextPayloadSchema>;
