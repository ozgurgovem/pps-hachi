import { z } from "zod";
import { EntrySchema } from "./entry";

/**
 * D-53: `readiness` is deliberately absent. `SPEC.md` §4.2 sketches it inside
 * `StepState` but marks it "derived, not stored" in the same line — a stored
 * readiness goes stale the moment a gate rule changes. It lives as a selector
 * return type in `src/domain/readiness/` instead, computed from `entries`.
 */
export const StepStateSchema = z.looseObject({
  entries: z.array(EntrySchema),
  notes: z.string().optional(),
});

export type StepState = z.infer<typeof StepStateSchema>;
