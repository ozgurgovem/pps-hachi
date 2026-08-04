import { describe, expect, it } from "vitest";
import { createNewProject } from "../model/createProject";
import type { Entry, ProjectModel, StepId } from "../model";
import { findOrphanedReferences, findReferencesTo, listReferenceableEntries } from "./findOrphanedReferences";

function entry(id: string, overrides: Partial<Entry> = {}): Entry {
  return {
    id,
    methodId: "generic-text",
    title: `Entry ${id}`,
    order: 0,
    a3Visibility: "primary",
    payload: {},
    images: [],
    createdAt: "2026-08-03T00:00:00.000Z",
    updatedAt: "2026-08-03T00:00:00.000Z",
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

describe("findOrphanedReferences", () => {
  it("returns nothing for a project whose references all resolve", () => {
    const project = projectWith({
      2: [entry("poc-1")],
      4: [entry("rc-1", { references: [{ role: "pointOfCause", targetEntryId: "poc-1" }] })],
    });

    expect(findOrphanedReferences(project)).toEqual([]);
  });

  it("reports a reference whose target no longer exists", () => {
    const project = projectWith({
      4: [entry("rc-1", { references: [{ role: "pointOfCause", targetEntryId: "poc-deleted" }] })],
    });

    expect(findOrphanedReferences(project)).toEqual([
      {
        stepId: 4,
        entryId: "rc-1",
        entryTitle: "Entry rc-1",
        reference: { role: "pointOfCause", targetEntryId: "poc-deleted" },
      },
    ]);
  });

  it("resolves a target that lives in any step, not only an earlier one", () => {
    const project = projectWith({
      2: [entry("a", { references: [{ role: "countermeasure", targetEntryId: "z" }] })],
      6: [entry("z")],
    });

    expect(findOrphanedReferences(project)).toEqual([]);
  });

  it("reports every dangling reference an entry holds, not just the first", () => {
    const project = projectWith({
      5: [
        entry("cm-1", {
          references: [
            { role: "rootCause", targetEntryId: "gone-1" },
            { role: "rootCause", targetEntryId: "gone-2" },
          ],
        }),
      ],
    });

    expect(findOrphanedReferences(project)).toHaveLength(2);
  });

  it("treats an entry with no references field at all as clean", () => {
    const project = projectWith({ 1: [entry("plain")] });

    expect(findOrphanedReferences(project)).toEqual([]);
  });

  it("does not treat a self-reference as orphaned — the target exists", () => {
    const project = projectWith({
      4: [entry("self", { references: [{ role: "rootCause", targetEntryId: "self" }] })],
    });

    expect(findOrphanedReferences(project)).toEqual([]);
  });

  /**
   * D-117: deletion leaves the reference dangling and undo restores it. The
   * selector is the only thing that notices, and it must notice in both
   * directions — otherwise undo would appear to "not fix" the orphan.
   */
  it("goes orphaned on delete and clean again when the target comes back", () => {
    const withTarget = projectWith({
      2: [entry("poc-1")],
      4: [entry("rc-1", { references: [{ role: "pointOfCause", targetEntryId: "poc-1" }] })],
    });
    const afterDelete: ProjectModel = {
      ...withTarget,
      steps: { ...withTarget.steps, 2: { ...withTarget.steps[2], entries: [] } },
    };

    expect(findOrphanedReferences(afterDelete)).toHaveLength(1);
    expect(findOrphanedReferences(withTarget)).toEqual([]);
  });
});

describe("findReferencesTo", () => {
  it("finds the entries pointing at a given target, across steps", () => {
    const project = projectWith({
      2: [entry("poc-1")],
      4: [entry("rc-1", { references: [{ role: "pointOfCause", targetEntryId: "poc-1" }] })],
      5: [entry("cm-1", { references: [{ role: "rootCause", targetEntryId: "rc-1" }] })],
    });

    expect(findReferencesTo(project, "poc-1").map((r) => r.entryId)).toEqual(["rc-1"]);
    expect(findReferencesTo(project, "cm-1")).toEqual([]);
  });
});

describe("listReferenceableEntries", () => {
  it("lists entries from the requested steps only, in step then order sequence", () => {
    const project = projectWith({
      2: [entry("a"), entry("b")],
      4: [entry("c")],
      5: [entry("d")],
    });

    const candidates = listReferenceableEntries(project, [2, 4]);

    expect(candidates.map((c) => c.entryId)).toEqual(["a", "b", "c"]);
    expect(candidates[0]).toMatchObject({ stepId: 2, entryTitle: "Entry a", methodId: "generic-text" });
  });

  it("excludes the entry currently being edited so nothing offers a self-reference", () => {
    const project = projectWith({ 4: [entry("a"), entry("b")] });

    expect(listReferenceableEntries(project, [4], "a").map((c) => c.entryId)).toEqual(["b"]);
  });
});
