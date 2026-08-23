import type { StepState } from "../../../domain/model";
import type { ReadinessResult } from "../../../domain/readiness";

/**
 * D-85/D-196 (G1): SPEC.md §2.2 lists four left-rail completion states
 * (empty / in progress / complete / flagged). `complete`/`flagged` now read
 * from the Phase 7 readiness selector (`src/domain/readiness`) — per
 * Barış's own confirmed answer, "complete" is simply "not empty and the
 * readiness selector found nothing to flag" (the direct complement of
 * "flagged"), not a separate per-field completeness concept this app has no
 * other machinery for.
 *
 * `"inProgress"` stays in the union (Badge/i18n already carry it) but is
 * never produced by `getStepStatus` today: a non-empty step's readiness is
 * binary (`"ok"` or `"flagged"`, see `evaluateReadiness.ts`), so once a step
 * has an entry it is always either complete or flagged. Documented rather
 * than quietly left dead — a future rule that can express a genuine
 * in-between state would use it.
 */
export type StepStatus = "empty" | "inProgress" | "complete" | "flagged";

export function isStepEmpty(step: StepState): boolean {
  return step.entries.length === 0;
}

export function getStepStatus(step: StepState, readiness: ReadinessResult): StepStatus {
  if (isStepEmpty(step)) {
    return "empty";
  }
  return readiness.status === "flagged" ? "flagged" : "complete";
}
