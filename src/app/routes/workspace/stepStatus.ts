import type { StepState } from "../../../domain/model";

/**
 * D-85: SPEC.md §2.2 lists four left-rail completion states (empty / in
 * progress / complete / flagged), but "complete" and "flagged" both require
 * the readiness gate rules (§1.2, S1-S8) that don't ship until Phase 7 —
 * `StepState.readiness` is deliberately never persisted (D-53) and no gate
 * rule exists yet to derive it from. Phase 3 computes only the two states
 * that are honest without that system: an entry-count check, the same
 * provisional-selector pattern D-65 already used for the launch screen's
 * `currentStep`. Wiring `complete`/`flagged` in is Phase 7 work.
 */
export type StepStatus = "empty" | "inProgress";

export function getStepStatus(step: StepState): StepStatus {
  return step.entries.length === 0 ? "empty" : "inProgress";
}
