import { STEP_IDS, type EntryReference, type ProjectModel, type StepId } from "../model";

/**
 * D-117: orphans are **derived, never stored**. Deleting a referenced entry
 * is permitted and changes nothing on the entries that point at it, so the
 * only thing that ever knows a reference dangles is this selector, recomputed
 * from the current `ProjectModel`. That is what makes undo correct for free:
 * `entry.remove`'s inverse restores the target and every reference resolves
 * again, with no compensating logic anywhere.
 *
 * D-53's rule one layer over: a stored integrity verdict goes stale the
 * moment an entry moves, and the file would then disagree with the app.
 * Nothing here runs at load time — a `.ppsx` carrying dangling references
 * must still open (D-59's read-only-open promise).
 *
 * The warning UI belongs to Phase 7's traceability view; 6b ships the data
 * and this selector.
 */

export interface OrphanedReference {
  readonly stepId: StepId;
  /** The entry *holding* the dangling reference, not the missing target. */
  readonly entryId: string;
  readonly entryTitle: string;
  readonly reference: EntryReference;
}

export interface ReferenceableEntry {
  readonly stepId: StepId;
  readonly entryId: string;
  readonly entryTitle: string;
  readonly methodId: string;
}

function collectEntryIds(project: ProjectModel): ReadonlySet<string> {
  const ids = new Set<string>();
  for (const stepId of STEP_IDS) {
    for (const entry of project.steps[stepId].entries) {
      ids.add(entry.id);
    }
  }
  return ids;
}

/** Every reference in the project whose `targetEntryId` matches no entry. */
export function findOrphanedReferences(project: ProjectModel): readonly OrphanedReference[] {
  const known = collectEntryIds(project);
  const orphans: OrphanedReference[] = [];

  for (const stepId of STEP_IDS) {
    for (const entry of project.steps[stepId].entries) {
      for (const reference of entry.references ?? []) {
        if (!known.has(reference.targetEntryId)) {
          orphans.push({ stepId, entryId: entry.id, entryTitle: entry.title, reference });
        }
      }
    }
  }

  return orphans;
}

/**
 * The inbound direction: which entries point *at* `targetEntryId`. Phase 7's
 * traceability view walks the chain with this; a warn-before-delete would use
 * it to say what is about to dangle. Deliberately not used to *block* a
 * delete — D-117 permits the delete.
 */
export function findReferencesTo(
  project: ProjectModel,
  targetEntryId: string,
): readonly { readonly stepId: StepId; readonly entryId: string; readonly reference: EntryReference }[] {
  const found: { stepId: StepId; entryId: string; reference: EntryReference }[] = [];

  for (const stepId of STEP_IDS) {
    for (const entry of project.steps[stepId].entries) {
      for (const reference of entry.references ?? []) {
        if (reference.targetEntryId === targetEntryId) {
          found.push({ stepId, entryId: entry.id, reference });
        }
      }
    }
  }

  return found;
}

/**
 * Candidate targets for a reference role, in step-then-`order` sequence —
 * what the picker lists. `excludeEntryId` drops the entry currently being
 * edited so nothing ever offers a self-reference; note that an *existing*
 * self-reference is still not an orphan (its target exists), which is the
 * correct reading of D-117 rather than a second integrity rule sneaking in.
 */
export function listReferenceableEntries(
  project: ProjectModel,
  fromSteps: readonly StepId[],
  excludeEntryId?: string,
): readonly ReferenceableEntry[] {
  const candidates: ReferenceableEntry[] = [];

  for (const stepId of STEP_IDS) {
    if (!fromSteps.includes(stepId)) {
      continue;
    }
    for (const entry of project.steps[stepId].entries) {
      if (entry.id === excludeEntryId) {
        continue;
      }
      candidates.push({
        stepId,
        entryId: entry.id,
        entryTitle: entry.title,
        methodId: entry.methodId,
      });
    }
  }

  return candidates;
}
