import { STEP_IDS, type ProjectModel } from "../../domain/model";

/**
 * How many of the 8 steps have at least one entry — a simple proxy for
 * progress, shared by the launch screen's recent list and the post-open
 * confirmation screen. Not the real readiness/gate system
 * (`src/domain/readiness/`, Phase 7); that needs gate rules that don't
 * exist yet.
 */
export function countStepsWithEntries(project: ProjectModel): number {
  return STEP_IDS.filter((stepId) => project.steps[stepId].entries.length > 0).length;
}
