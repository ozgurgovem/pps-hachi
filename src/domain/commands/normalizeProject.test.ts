import { describe, expect, it } from "vitest";
import type { Entry, ProjectModel } from "../model";
import { createNewProject } from "../model";
import { normalizeProject } from "./normalizeProject";

function makeEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: "entry-1",
    methodId: "generic-text",
    title: "Entry",
    order: 0,
    a3Visibility: "primary",
    payload: {},
    images: [],
    createdAt: "2026-08-02T00:00:00.000Z",
    updatedAt: "2026-08-02T00:00:00.000Z",
    provenance: { origin: "human" },
    ...overrides,
  };
}

function makeProject(entries: Entry[]): ProjectModel {
  const { project } = createNewProject({ title: "Test", language: "en", appVersion: "0.1.0" });
  return { ...project, steps: { ...project.steps, 4: { entries } } };
}

describe("normalizeProject", () => {
  it("sorts each step's entries by order and re-sequences to be contiguous", () => {
    const project = makeProject([
      makeEntry({ id: "c", order: 5 }),
      makeEntry({ id: "a", order: 0 }),
      makeEntry({ id: "b", order: 2 }),
    ]);

    const normalized = normalizeProject(project);

    expect(normalized.steps[4].entries.map((e) => e.id)).toEqual(["a", "b", "c"]);
    expect(normalized.steps[4].entries.map((e) => e.order)).toEqual([0, 1, 2]);
  });

  it("breaks ties by existing array position (stable sort)", () => {
    const project = makeProject([
      makeEntry({ id: "first", order: 1 }),
      makeEntry({ id: "second", order: 1 }),
    ]);

    const normalized = normalizeProject(project);

    expect(normalized.steps[4].entries.map((e) => e.id)).toEqual(["first", "second"]);
  });

  it("leaves an already-contiguous step untouched (same object identity)", () => {
    const project = makeProject([makeEntry({ id: "a", order: 0 }), makeEntry({ id: "b", order: 1 })]);

    const normalized = normalizeProject(project);

    expect(normalized.steps[4]).toBe(project.steps[4]);
  });

  it("normalizes every one of the 8 steps independently", () => {
    const { project } = createNewProject({ title: "Test", language: "en", appVersion: "0.1.0" });
    const withEntries: ProjectModel = {
      ...project,
      steps: {
        ...project.steps,
        1: { entries: [makeEntry({ id: "s1b", order: 9 }), makeEntry({ id: "s1a", order: 0 })] },
        8: { entries: [makeEntry({ id: "s8b", order: 9 }), makeEntry({ id: "s8a", order: 0 })] },
      },
    };

    const normalized = normalizeProject(withEntries);

    expect(normalized.steps[1].entries.map((e) => e.id)).toEqual(["s1a", "s1b"]);
    expect(normalized.steps[8].entries.map((e) => e.id)).toEqual(["s8a", "s8b"]);
  });
});
