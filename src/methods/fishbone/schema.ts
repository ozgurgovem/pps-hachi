import { z } from "zod";
import { FISHBONE_CATEGORY_SETS } from "./categories";

/**
 * D-103: category positions are algorithmic (never persisted); only causes
 * carry a freeform `position` (React-Flow-shaped, D-102/D-103). Edges are
 * derived from `categoryId`/`parentCauseId` at render time, never stored —
 * see D-71 for why storing both a parent reference and an edge list is the
 * wrong shape. Loose per D-51's project-wide convention.
 */
export const FishboneCauseSchema = z.looseObject({
  id: z.string(),
  categoryId: z.string(),
  /** One level of sub-cause nesting — the parent must be a top-level cause (no `parentCauseId` of its own). */
  parentCauseId: z.string().optional(),
  text: z.string(),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
});

export const FishbonePayloadSchema = z.looseObject({
  categorySet: z.enum(FISHBONE_CATEGORY_SETS),
  causes: z.array(FishboneCauseSchema),
});

export type FishboneCause = z.infer<typeof FishboneCauseSchema>;
export type FishbonePayload = z.infer<typeof FishbonePayloadSchema>;
