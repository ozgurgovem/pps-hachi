import { STEP_IDS, type Entry, type EntryReference, type ProjectModel, type StepId } from "../model";

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

function collectEntriesById(project: ProjectModel): ReadonlyMap<string, Entry> {
  const byId = new Map<string, Entry>();
  for (const stepId of STEP_IDS) {
    for (const entry of project.steps[stepId].entries) {
      byId.set(entry.id, entry);
    }
  }
  return byId;
}

/**
 * D-185/P-39: `whyWhyTree`'s payload is `z.unknown()` at the domain-model
 * level (D-52), and this selector lives under `src/domain`, which never
 * imports `src/methods` (G1's own boundary, D-196's precedent one layer
 * over) — so a node's existence is checked by shape, not by importing the
 * real `WhyWhyTreePayloadSchema`. Defensive, not type-safe, the same
 * posture `RowTableEditor.tsx`'s `?? ""` fix already established (C1/D-180)
 * one level up from a bare payload read.
 */
function targetNodeExists(payload: unknown, nodeId: string): boolean {
  if (typeof payload !== "object" || payload === null || !("nodes" in payload)) {
    return false;
  }
  const nodes = (payload as { nodes: unknown }).nodes;
  if (!Array.isArray(nodes)) {
    return false;
  }
  return nodes.some(
    (node) => typeof node === "object" && node !== null && (node as { id?: unknown }).id === nodeId,
  );
}

/**
 * Every reference in the project whose `targetEntryId` matches no entry, or
 * whose `targetNodeId` (D-185/P-39) names a node no longer present inside
 * the target entry's own payload. A reference with no `targetNodeId` is
 * never node-orphaned by that check alone — it targets the whole entry,
 * which the first check already covers.
 */
export function findOrphanedReferences(project: ProjectModel): readonly OrphanedReference[] {
  const entriesById = collectEntriesById(project);
  const orphans: OrphanedReference[] = [];

  for (const stepId of STEP_IDS) {
    for (const entry of project.steps[stepId].entries) {
      for (const reference of entry.references ?? []) {
        const target = entriesById.get(reference.targetEntryId);
        if (!target) {
          orphans.push({ stepId, entryId: entry.id, entryTitle: entry.title, reference });
          continue;
        }
        if (reference.targetNodeId !== undefined && !targetNodeExists(target.payload, reference.targetNodeId)) {
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
