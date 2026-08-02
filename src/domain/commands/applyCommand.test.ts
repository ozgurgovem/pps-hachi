import { describe, expect, it } from "vitest";
import type { Entry, ProjectModel } from "../model";
import { createNewProject } from "../model";
import { applyCommand } from "./applyCommand";
import { invertCommand } from "./invertCommand";
import { CommandPreconditionError, type Command } from "./types";

function makeEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: "entry-1",
    methodId: "generic-text",
    title: "First entry",
    order: 0,
    a3Visibility: "primary",
    payload: { text: "hello" },
    images: [],
    createdAt: "2026-08-02T00:00:00.000Z",
    updatedAt: "2026-08-02T00:00:00.000Z",
    provenance: { origin: "human" },
    ...overrides,
  };
}

function makeProject(entries: Entry[] = []): ProjectModel {
  const { project } = createNewProject({ title: "Test", language: "en", appVersion: "0.1.0" });
  return { ...project, steps: { ...project.steps, 4: { entries } } };
}

describe("applyCommand — entry.insert", () => {
  it("inserts the entry at the given index and re-sequences order", () => {
    const project = makeProject([makeEntry({ id: "a", order: 0 }), makeEntry({ id: "b", order: 1 })]);
    const command: Command = {
      type: "entry.insert",
      stepId: 4,
      entry: makeEntry({ id: "new", order: 99 }),
      index: 1,
      undoable: true,
    };

    const next = applyCommand(project, command);

    expect(next.steps[4].entries.map((e) => e.id)).toEqual(["a", "new", "b"]);
    expect(next.steps[4].entries.map((e) => e.order)).toEqual([0, 1, 2]);
  });

  it("does not mutate the original project", () => {
    const project = makeProject([makeEntry({ id: "a", order: 0 })]);
    const before = JSON.parse(JSON.stringify(project));
    const command: Command = {
      type: "entry.insert",
      stepId: 4,
      entry: makeEntry({ id: "new" }),
      index: 1,
      undoable: true,
    };

    applyCommand(project, command);

    expect(project).toEqual(before);
  });

  it("throws a precondition error when an entry with that id already exists", () => {
    const project = makeProject([makeEntry({ id: "a", order: 0 })]);
    const command: Command = {
      type: "entry.insert",
      stepId: 4,
      entry: makeEntry({ id: "a" }),
      index: 0,
      undoable: true,
    };

    expect(() => applyCommand(project, command)).toThrow(CommandPreconditionError);
  });
});

describe("applyCommand — entry.remove", () => {
  it("removes the entry and re-sequences order with no gaps", () => {
    const project = makeProject([
      makeEntry({ id: "a", order: 0 }),
      makeEntry({ id: "b", order: 1 }),
      makeEntry({ id: "c", order: 2 }),
    ]);
    const command: Command = {
      type: "entry.remove",
      stepId: 4,
      entry: project.steps[4].entries[1]!,
      index: 1,
      undoable: true,
    };

    const next = applyCommand(project, command);

    expect(next.steps[4].entries.map((e) => e.id)).toEqual(["a", "c"]);
    expect(next.steps[4].entries.map((e) => e.order)).toEqual([0, 1]);
  });

  it("throws a precondition error when the entry no longer exists", () => {
    const project = makeProject([makeEntry({ id: "a" })]);
    const command: Command = {
      type: "entry.remove",
      stepId: 4,
      entry: makeEntry({ id: "gone" }),
      index: 0,
      undoable: true,
    };

    expect(() => applyCommand(project, command)).toThrow(CommandPreconditionError);
  });
});

describe("applyCommand — entry.update", () => {
  it("replaces the entry with `after`, leaving other entries untouched", () => {
    const project = makeProject([makeEntry({ id: "a" }), makeEntry({ id: "b" })]);
    const after = { ...project.steps[4].entries[0]!, title: "Renamed", updatedAt: "2026-08-02T02:00:00.000Z" };
    const command: Command = {
      type: "entry.update",
      stepId: 4,
      entryId: "a",
      before: project.steps[4].entries[0]!,
      after,
      undoable: true,
    };

    const next = applyCommand(project, command);

    expect(next.steps[4].entries[0]!).toEqual(after);
    expect(next.steps[4].entries[1]!).toEqual(project.steps[4].entries[1]!);
  });

  it("throws a precondition error when the entry no longer exists", () => {
    const project = makeProject([makeEntry({ id: "a" })]);
    const missing = makeEntry({ id: "gone" });
    const command: Command = {
      type: "entry.update",
      stepId: 4,
      entryId: "gone",
      before: missing,
      after: { ...missing, title: "x" },
      undoable: true,
    };

    expect(() => applyCommand(project, command)).toThrow(CommandPreconditionError);
  });
});

describe("applyCommand — entry.setA3Visibility", () => {
  it("changes only the target entry's a3Visibility", () => {
    const project = makeProject([
      makeEntry({ id: "a", a3Visibility: "primary" }),
      makeEntry({ id: "b", a3Visibility: "primary" }),
    ]);
    const command: Command = {
      type: "entry.setA3Visibility",
      stepId: 4,
      entryId: "a",
      before: "primary",
      after: "appendix",
      undoable: true,
    };

    const next = applyCommand(project, command);

    expect(next.steps[4].entries[0]!.a3Visibility).toBe("appendix");
    expect(next.steps[4].entries[1]!.a3Visibility).toBe("primary");
  });

  it("works on an entry with an unknown methodId — P-05's structural half", () => {
    const project = makeProject([makeEntry({ id: "a", methodId: "future-method", payload: { x: 1 } })]);
    const command: Command = {
      type: "entry.setA3Visibility",
      stepId: 4,
      entryId: "a",
      before: "primary",
      after: "hidden",
      undoable: true,
    };

    const next = applyCommand(project, command);

    expect(next.steps[4].entries[0]!.a3Visibility).toBe("hidden");
    expect(next.steps[4].entries[0]!.payload).toEqual({ x: 1 });
  });
});

describe("applyCommand — entries.reorder", () => {
  it("moves entries into the `after` order and re-sequences order", () => {
    const project = makeProject([
      makeEntry({ id: "a", order: 0 }),
      makeEntry({ id: "b", order: 1 }),
      makeEntry({ id: "c", order: 2 }),
    ]);
    const command: Command = {
      type: "entries.reorder",
      stepId: 4,
      before: ["a", "b", "c"],
      after: ["c", "a", "b"],
      undoable: true,
    };

    const next = applyCommand(project, command);

    expect(next.steps[4].entries.map((e) => e.id)).toEqual(["c", "a", "b"]);
    expect(next.steps[4].entries.map((e) => e.order)).toEqual([0, 1, 2]);
  });

  it("throws a precondition error when the recorded id set no longer matches current entries", () => {
    const project = makeProject([makeEntry({ id: "a" }), makeEntry({ id: "b" })]);
    const command: Command = {
      type: "entries.reorder",
      stepId: 4,
      before: ["a", "b", "c"], // "c" doesn't exist — stale command
      after: ["c", "b", "a"],
      undoable: true,
    };

    expect(() => applyCommand(project, command)).toThrow(CommandPreconditionError);
  });
});

describe("invertCommand", () => {
  it("insert inverts to remove with the same entry/index", () => {
    const command: Command = {
      type: "entry.insert",
      stepId: 4,
      entry: makeEntry({ id: "a" }),
      index: 2,
      undoable: true,
    };
    expect(invertCommand(command)).toEqual({ ...command, type: "entry.remove" });
  });

  it("remove inverts to insert with the same entry/index", () => {
    const command: Command = {
      type: "entry.remove",
      stepId: 4,
      entry: makeEntry({ id: "a" }),
      index: 2,
      undoable: true,
    };
    expect(invertCommand(command)).toEqual({ ...command, type: "entry.insert" });
  });

  it("update inverts by swapping before/after", () => {
    const before = makeEntry({ id: "a", title: "Old" });
    const after = makeEntry({ id: "a", title: "New" });
    const command: Command = { type: "entry.update", stepId: 4, entryId: "a", before, after, undoable: true };
    expect(invertCommand(command)).toEqual({ ...command, before: after, after: before });
  });

  it("setA3Visibility inverts by swapping before/after", () => {
    const command: Command = {
      type: "entry.setA3Visibility",
      stepId: 4,
      entryId: "a",
      before: "primary",
      after: "hidden",
      undoable: true,
    };
    expect(invertCommand(command)).toEqual({ ...command, before: "hidden", after: "primary" });
  });

  it("reorder inverts by swapping before/after id arrays", () => {
    const command: Command = {
      type: "entries.reorder",
      stepId: 4,
      before: ["a", "b"],
      after: ["b", "a"],
      undoable: true,
    };
    expect(invertCommand(command)).toEqual({ ...command, before: ["b", "a"], after: ["a", "b"] });
  });

  it("apply then invert-and-apply round-trips to the original project", () => {
    const project = makeProject([makeEntry({ id: "a", order: 0 }), makeEntry({ id: "b", order: 1 })]);
    const command: Command = {
      type: "entries.reorder",
      stepId: 4,
      before: ["a", "b"],
      after: ["b", "a"],
      undoable: true,
    };

    const applied = applyCommand(project, command);
    const restored = applyCommand(applied, invertCommand(command));

    expect(restored).toEqual(project);
  });
});
