import { STEP_IDS, type Entry, type ProjectModel, type StepState } from "../model";

function resequence(entries: Entry[]): Entry[] {
  return entries.map((entry, index) => (entry.order === index ? entry : { ...entry, order: index }));
}

function isAlreadyContiguous(entries: readonly Entry[]): boolean {
  return entries.every((entry, index) => entry.order === index);
}

function normalizeStep(step: StepState): StepState {
  if (isAlreadyContiguous(step.entries)) {
    return step;
  }
  // Stable sort (spec-guaranteed since ES2019): entries with equal `order`
  // keep their existing relative position instead of an arbitrary one.
  const sorted = [...step.entries].sort((a, b) => a.order - b.order);
  return { ...step, entries: resequence(sorted) };
}

/**
 * D-71: run once when a project is loaded into the store. `order` and array
 * position can disagree in a file written by an older build or a not-yet-
 * normalized migration; after this, array position is authoritative and
 * every subsequent command keeps `order` in sync with it.
 */
export function normalizeProject(project: ProjectModel): ProjectModel {
  const steps = { ...project.steps };
  for (const stepId of STEP_IDS) {
    steps[stepId] = normalizeStep(project.steps[stepId]);
  }
  return { ...project, steps };
}
