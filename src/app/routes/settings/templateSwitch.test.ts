import { describe, expect, it } from "vitest";
import { createNewProject, type Entry, type ProjectModel } from "../../../domain/model";
import { previewTemplateSwitch } from "./templateSwitch";

function makeEntry(overrides: Partial<Entry> = {}): Entry {
  const now = new Date().toISOString();
  return {
    id: overrides.id ?? crypto.randomUUID(),
    methodId: "generic-text",
    title: "A test entry",
    order: 0,
    a3Visibility: "primary",
    payload: { text: "short body text" },
    images: [],
    createdAt: now,
    updatedAt: now,
    provenance: { origin: "human" },
    ...overrides,
  };
}

function seedProject(templateId: string, entries: Record<number, Entry[]>): ProjectModel {
  const { project } = createNewProject({ title: "T", language: "en", appVersion: "0.1.0" });
  const steps = { ...project.steps };
  for (const [stepId, list] of Object.entries(entries)) {
    const numericStepId = Number(stepId) as keyof typeof steps;
    steps[numericStepId] = { entries: list };
  }
  return { ...project, templateId, steps };
}

describe("previewTemplateSwitch (Faz 11/L2)", () => {
  it("reports no dropped entries for a project with no entries at all", () => {
    const project = seedProject("pps-8step-auto", {});

    const preview = previewTemplateSwitch(project, "farplas-7step-tr");

    expect(preview.droppedEntries).toEqual([]);
  });

  it("reports no dropped entries when a step's small content clearly fits the target template", () => {
    const project = seedProject("farplas-7step-tr", {
      1: [makeEntry({ id: "e1", title: "One short entry", order: 0 })],
    });

    const preview = previewTemplateSwitch(project, "pps-8step-auto");

    expect(preview.droppedEntries).toEqual([]);
  });

  it("names every entry that would overflow the target template's block budget, with its title and step", () => {
    // Enough entries that no block's finite row budget can hold them all,
    // regardless of which of the two real templates is the target — this is
    // what actually exercises `buildA3Layout`'s own D-100 mechanism rather
    // than asserting against a hand-picked row count.
    const manyEntries = Array.from({ length: 60 }, (_, index) =>
      makeEntry({
        id: `overflow-${index}`,
        title: `Overflowing entry number ${index}`,
        order: index,
        payload: { text: "A body long enough to occupy its own printed line in the block." },
      }),
    );
    const project = seedProject("farplas-7step-tr", { 1: manyEntries });

    const preview = previewTemplateSwitch(project, "pps-8step-auto");

    expect(preview.droppedEntries.length).toBeGreaterThan(0);
    for (const dropped of preview.droppedEntries) {
      expect(dropped.stepId).toBe(1);
      expect(dropped.title).toMatch(/^Overflowing entry number \d+$/);
      expect(manyEntries.some((entry) => entry.id === dropped.entryId)).toBe(true);
    }
  });

  it("never reports an entry the user already marked appendix — buildA3Layout only drops primary entries", () => {
    const manyAppendixEntries = Array.from({ length: 60 }, (_, index) =>
      makeEntry({
        id: `appendix-${index}`,
        title: `Already appendix ${index}`,
        order: index,
        a3Visibility: "appendix",
      }),
    );
    const project = seedProject("farplas-7step-tr", { 1: manyAppendixEntries });

    const preview = previewTemplateSwitch(project, "pps-8step-auto");

    expect(preview.droppedEntries).toEqual([]);
  });

  it("is a pure dry run — the source project object is left untouched", () => {
    const project = seedProject("pps-8step-auto", {
      2: [makeEntry({ id: "e2", title: "Step two entry" })],
    });
    const before = JSON.parse(JSON.stringify(project));

    previewTemplateSwitch(project, "farplas-7step-tr");

    expect(project).toEqual(before);
  });
});
