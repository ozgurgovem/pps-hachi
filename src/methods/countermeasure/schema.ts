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
  /**
   * Barış's own "Uygulama Planı" table (2026-08-18): each 1-5, "how
   * favorable" not raw magnitude — high `costScore`/`durationScore` means
   * cheap/fast, not expensive/slow. `priorityScoreOf` (this method's own
   * `priorityScore.ts`) multiplies the three; blank/non-numeric stays
   * unscored rather than defaulting to 0, same D-120 posture as
   * `impactEffortMatrix`/`causeEffectMatrix`.
   */
  impactScore: z.string(),
  costScore: z.string(),
  durationScore: z.string(),
  /**
   * Deliberately separate from `status` above: `status` is whether the
   * countermeasure *idea* was accepted; `priorityDecision` is whether it's
   * actually scheduled now, given the computed score. Always an explicit
   * human choice, never inferred from the score — same rule D-41's status
   * glyphs already follow project-wide (a low score can still be pursued
   * for a strategic reason a formula can't see).
   */
  priorityDecision: z.string(),
});

export type CountermeasurePayload = z.infer<typeof CountermeasurePayloadSchema>;
