import { z } from "zod";

/**
 * D-58: metadata only — opened-at, reason, closed-at. Not a snapshot of the
 * step 4–7 entries open under this round; those carry `roundId` themselves
 * (see `entry.ts`), keeping one entry list instead of duplicating it per round.
 */
export const RoundSchema = z.looseObject({
  id: z.string(),
  openedAt: z.iso.datetime(),
  reason: z.string(),
  closedAt: z.iso.datetime().optional(),
});

export type Round = z.infer<typeof RoundSchema>;
