import { describe, expect, it } from "vitest";
import { createNewProject } from "../../../domain/model";
import type { Entry, EntryReference, ProjectModel, StepId } from "../../../domain/model";
import { buildTraceabilityChains } from "./traceability";

function entry(
  id: string,
  methodId: string,
  overrides: Partial<Entry> & { references?: readonly EntryReference[] } = {},
): Entry {
  return {
    id,
    methodId,
    title: `Entry ${id}`,
    order: 0,
    a3Visibility: "primary",
    payload: {},
    images: [],
    createdAt: "2026-08-20T00:00:00.000Z",
    updatedAt: "2026-08-20T00:00:00.000Z",
    provenance: { origin: "human" },
    ...overrides,
  };
}

function projectWith(entriesByStep: Partial<Record<StepId, readonly Entry[]>>): ProjectModel {
  const { project } = createNewProject({ title: "T", language: "tr", appVersion: "0.0.0" });
  const steps = { ...project.steps };
  for (const [stepId, entries] of Object.entries(entriesByStep)) {
    const key = Number(stepId) as StepId;
    steps[key] = { ...steps[key], entries: entries.map((e, index) => ({ ...e, order: index })) };
  }
  return { ...project, steps };
}

describe("buildTraceabilityChains", () => {
  it("returns no chains for a brand-new project", () => {
    const { project } = createNewProject({ title: "T", language: "tr", appVersion: "0.0.0" });
    expect(buildTraceabilityChains(project)).toEqual([]);
  });

  it("does not treat an entry with zero inbound and zero outbound references as a chain", () => {
    const project = projectWith({ 2: [entry("poc1", "point-of-cause")] });
    expect(buildTraceabilityChains(project)).toEqual([]);
  });

  it("builds a two-level chain from a root to the entry that references it", () => {
    const project = projectWith({
      2: [entry("poc1", "point-of-cause", { title: "Mold cavity wear" })],
      4: [
        entry("h1", "hypothesis-verification", {
          title: "Cavity wear hypothesis",
          references: [{ role: "pointOfCause", targetEntryId: "poc1" }],
        }),
      ],
    });

    const chains = buildTraceabilityChains(project);
    expect(chains).toEqual([
      {
        stepId: 2,
        entryId: "poc1",
        entryTitle: "Mold cavity wear",
        role: undefined,
        children: [
          {
            stepId: 4,
            entryId: "h1",
            entryTitle: "Cavity wear hypothesis",
            role: "pointOfCause",
            children: [],
          },
        ],
      },
    ]);
  });

  it("walks the full Step 2 -> 4 -> 5 -> 6 chain", () => {
    const project = projectWith({
      2: [entry("poc1", "point-of-cause")],
      4: [entry("h1", "hypothesis-verification", { references: [{ role: "pointOfCause", targetEntryId: "poc1" }] })],
      5: [entry("c1", "countermeasure", { references: [{ role: "rootCause", targetEntryId: "h1" }] })],
      6: [entry("a1", "action-item", { references: [{ role: "countermeasure", targetEntryId: "c1" }] })],
    });

    const chains = buildTraceabilityChains(project);
    expect(chains).toHaveLength(1);
    const root = chains[0]!;
    expect(root.entryId).toBe("poc1");
    const level4 = root.children[0]!;
    expect(level4.entryId).toBe("h1");
    const level5 = level4.children[0]!;
    expect(level5.entryId).toBe("c1");
    const level6 = level5.children[0]!;
    expect(level6.entryId).toBe("a1");
    expect(level6.role).toBe("countermeasure");
    expect(level6.children).toEqual([]);
  });

  it("branches into same-step referrers (error-proofing hierarchy / side-effect risk assessment on a countermeasure)", () => {
    const project = projectWith({
      4: [entry("h1", "hypothesis-verification")],
      5: [
        entry("c1", "countermeasure", { references: [{ role: "rootCause", targetEntryId: "h1" }] }),
        entry("eph1", "error-proofing-hierarchy", {
          references: [{ role: "countermeasure", targetEntryId: "c1" }],
        }),
        entry("ser1", "side-effect-risk-assessment", {
          references: [{ role: "countermeasure", targetEntryId: "c1" }],
        }),
      ],
    });

    const chains = buildTraceabilityChains(project);
    // h1 is the only root — c1 has an outbound reference (to h1), so it is
    // never a root itself, only reachable as h1's child.
    expect(chains).toHaveLength(1);
    const c1Node = chains[0]!.children[0]!;
    expect(c1Node.entryId).toBe("c1");
    const childIds = c1Node.children.map((child) => child.entryId).sort();
    expect(childIds).toEqual(["eph1", "ser1"]);
  });

  it("lets one entry with two reference roles appear as a child of two independent roots", () => {
    const project = projectWith({
      1: [entry("ica1", "containment-ica")],
      5: [entry("c1", "countermeasure")],
      6: [
        entry("t1", "ica-pca-transition", {
          references: [
            { role: "containment", targetEntryId: "ica1" },
            { role: "countermeasure", targetEntryId: "c1" },
          ],
        }),
      ],
    });

    const chains = buildTraceabilityChains(project);
    expect(chains).toHaveLength(2);
    const byRoot = new Map(chains.map((chain) => [chain.entryId, chain]));
    expect(byRoot.get("ica1")?.children).toEqual([
      { stepId: 6, entryId: "t1", entryTitle: "Entry t1", role: "containment", children: [] },
    ]);
    expect(byRoot.get("c1")?.children).toEqual([
      { stepId: 6, entryId: "t1", entryTitle: "Entry t1", role: "countermeasure", children: [] },
    ]);
  });

  it("excludes an entry whose only reference dangles (orphan), since its target does not exist", () => {
    const project = projectWith({
      5: [entry("c1", "countermeasure", { references: [{ role: "rootCause", targetEntryId: "ghost" }] })],
    });
    expect(buildTraceabilityChains(project)).toEqual([]);
  });

  it("does not infinite-loop on a defensive cycle (an entry referencing back into its own ancestor path)", () => {
    const project = projectWith({
      2: [entry("r1", "point-of-cause")],
      4: [entry("b1", "hypothesis-verification", { references: [{ role: "pointOfCause", targetEntryId: "r1" }] })],
      5: [entry("a1", "countermeasure", { references: [{ role: "rootCause", targetEntryId: "b1" }] })],
    });
    // Manually plant a cycle: b1 also references a1 (its own descendant),
    // which the real app's reference picker would never construct (D-125's
    // picker excludes the entry being edited, but not a deeper descendant) —
    // defensive-only, per D-52's "never trust the payload/graph shape" posture.
    const withCycle: ProjectModel = {
      ...project,
      steps: {
        ...project.steps,
        4: {
          ...project.steps[4],
          entries: [
            {
              ...project.steps[4].entries[0]!,
              references: [
                { role: "pointOfCause", targetEntryId: "r1" },
                { role: "rootCause", targetEntryId: "a1" },
              ],
            },
          ],
        },
      },
    };

    expect(() => buildTraceabilityChains(withCycle)).not.toThrow();
  });
});
