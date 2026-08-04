import { z } from "zod";

/**
 * SPEC.md §1.3 (Step 5): one countermeasure per entry, not one entry holding
 * a list of them.
 *
 * That granularity is forced by D-116: references live on the `Entry`, so a
 * single entry holding N countermeasures could only carry the *union* of
 * their root-cause links — and §1.2 S5 ("flag if **any** countermeasure is
 * not linked to at least one verified root cause") is a per-countermeasure
 * rule that a union cannot answer. One traceable node, one entry. The step's
 * entries band is the "list" §1.3 names.
 *
 * Loose per D-51; `status` a plain string for the same reason D-116's `role`
 * is (a newer build's fourth status must round-trip).
 */
export const CountermeasurePayloadSchema = z.looseObject({
  description: z.string(),
  expectedEffect: z.string(),
  owner: z.string(),
  targetDate: z.string(),
  status: z.string(),
});

export type CountermeasurePayload = z.infer<typeof CountermeasurePayloadSchema>;
