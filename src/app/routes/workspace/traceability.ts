import { STEP_IDS, type ProjectModel, type StepId } from "../../../domain/model";
import { findReferencesTo } from "../../../domain/selectors";

/**
 * G2: a node in the traceability chain, walked *forward* — from the entry a
 * reference targets ("problem") to the entry that holds the reference
 * ("standard") — which is the opposite of `EntryReference`'s own storage
 * direction (D-116: a countermeasure *holds* a `rootCause` reference,
 * pointing back at the root cause it addresses). `role` is the role the
 * *incoming* reference carries (the one that produced this node from its
 * parent); `undefined` at a chain's root, which holds no reference of its
 * own.
 */
export interface TraceabilityNode {
  readonly stepId: StepId;
  readonly entryId: string;
  readonly entryTitle: string;
  readonly role: string | undefined;
  readonly children: readonly TraceabilityNode[];
}

interface EntryLocation {
  readonly stepId: StepId;
  readonly title: string;
}

function indexEntries(project: ProjectModel): ReadonlyMap<string, EntryLocation> {
  const index = new Map<string, EntryLocation>();
  for (const stepId of STEP_IDS) {
    for (const entry of project.steps[stepId].entries) {
      index.set(entry.id, { stepId, title: entry.title });
    }
  }
  return index;
}

function buildChildren(
  project: ProjectModel,
  entryId: string,
  visitedPath: ReadonlySet<string>,
  index: ReadonlyMap<string, EntryLocation>,
): readonly TraceabilityNode[] {
  const children: TraceabilityNode[] = [];
  for (const inbound of findReferencesTo(project, entryId)) {
    // Defensive cycle guard (D-52's posture: never trust the data fully) —
    // the reference graph should never loop back onto its own path, but an
    // entry with outbound refs is never barred from also being *targeted*,
    // so nothing in the model actually forbids one.
    if (visitedPath.has(inbound.entryId)) {
      continue;
    }
    const location = index.get(inbound.entryId);
    if (!location) {
      continue;
    }
    const nextVisited = new Set(visitedPath);
    nextVisited.add(inbound.entryId);
    children.push({
      stepId: location.stepId,
      entryId: inbound.entryId,
      entryTitle: location.title,
      role: inbound.reference.role,
      children: buildChildren(project, inbound.entryId, nextVisited, index),
    });
  }
  return children;
}

/**
 * Every traceability chain in the project, rooted at an entry that is
 * targeted by at least one reference but holds none of its own — the "start
 * of a chain" (a Step 2 point-of-cause, a Step 1 containment-ica) per
 * `docs/oturumlar/G2-traceability-gorunumu.md` §1's own registry scan. No
 * `methodId` is hardcoded anywhere in this file — a future reference-bearing
 * method needs no change here, the same generic-over-`references[]` posture
 * D-117's own selectors already take.
 *
 * The same entry can appear more than once across chains, or more than once
 * within one chain's branches, when it is legitimately reachable by more
 * than one path (e.g. `ica-pca-transition` holds *two* roles, `containment`
 * and `countermeasure` — it can be a child of both a Step 1 and a Step 5
 * root). That is not a bug: each occurrence is a real, independent path
 * through the reference graph.
 *
 * Relies on `project.steps[*].entries` already being sorted by `Entry.order`
 * (true for anything read from the store, via `normalizeProject`) for a
 * deterministic root/child order — this function does not re-sort.
 */
export function buildTraceabilityChains(project: ProjectModel): readonly TraceabilityNode[] {
  const index = indexEntries(project);
  const roots: TraceabilityNode[] = [];

  for (const stepId of STEP_IDS) {
    for (const entry of project.steps[stepId].entries) {
      if ((entry.references ?? []).length > 0) {
        continue;
      }
      const inbound = findReferencesTo(project, entry.id);
      if (inbound.length === 0) {
        continue;
      }
      roots.push({
        stepId,
        entryId: entry.id,
        entryTitle: entry.title,
        role: undefined,
        children: buildChildren(project, entry.id, new Set([entry.id]), index),
      });
    }
  }

  return roots;
}
