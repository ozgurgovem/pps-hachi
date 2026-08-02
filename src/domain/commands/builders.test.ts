import { describe, expect, it } from "vitest";
import type { Entry, StepState } from "../model";
import {
  buildAddEntryCommand,
  buildDeleteEntryCommand,
  buildDuplicateEntryCommand,
  buildReorderCommand,
  buildSetA3VisibilityCommand,
  buildUpdateEntryCommand,
} from "./builders";

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

function makeStep(entries: Entry[] = []): StepState {
  return { entries };
}

describe("buildAddEntryCommand", () => {
  it("builds an entry.insert command appending a fresh entry at the end", () => {
    const step = makeStep([makeEntry({ id: "a", order: 0 })]);

    const command = buildAddEntryCommand(step, 4, {
      methodId: "generic-text",
      title: "New",
      payload: { text: "x" },
      now: "2026-08-02T01:00:00.000Z",
    });

    expect(command).toMatchObject({
      type: "entry.insert",
      stepId: 4,
      index: 1,
      undoable: true,
    });
    expect(command.entry).toMatchObject({
      title: "New",
      methodId: "generic-text",
      a3Visibility: "primary",
      payload: { text: "x" },
      provenance: { origin: "human" },
    });
    expect(command.entry.id).toBeTruthy();
  });
});

describe("buildUpdateEntryCommand", () => {
  it("builds an entry.update command with the resolved before/after", () => {
    const entry = makeEntry({ id: "a" });
    const step = makeStep([entry]);

    const command = buildUpdateEntryCommand(step, 4, "a", {
      title: "Renamed",
      payload: { text: "changed" },
      now: "2026-08-02T02:00:00.000Z",
    });

    expect(command.before).toEqual(entry);
    expect(command.after).toMatchObject({ title: "Renamed", payload: { text: "changed" }, updatedAt: "2026-08-02T02:00:00.000Z" });
  });

  it("throws when the entry does not exist", () => {
    const step = makeStep([]);
    expect(() =>
      buildUpdateEntryCommand(step, 4, "missing", { title: "x", payload: {}, now: "2026-08-02T00:00:00.000Z" }),
    ).toThrow();
  });
});

describe("buildDeleteEntryCommand", () => {
  it("builds an entry.remove command carrying the entry and its index", () => {
    const step = makeStep([makeEntry({ id: "a" }), makeEntry({ id: "b" })]);

    const command = buildDeleteEntryCommand(step, 4, "b");

    expect(command).toMatchObject({ type: "entry.remove", stepId: 4, index: 1 });
    expect(command.entry.id).toBe("b");
  });
});

describe("buildDuplicateEntryCommand", () => {
  it("builds an entry.insert command right after the source with a (copy) title", () => {
    const step = makeStep([makeEntry({ id: "a", title: "Original" }), makeEntry({ id: "b" })]);

    const command = buildDuplicateEntryCommand(step, 4, "a", { now: "2026-08-02T03:00:00.000Z", newId: "a-copy" });

    expect(command).toMatchObject({ type: "entry.insert", stepId: 4, index: 1 });
    expect(command.entry).toMatchObject({ id: "a-copy", title: "Original (copy)", payload: { text: "hello" } });
  });
});

describe("buildReorderCommand", () => {
  it("builds an entries.reorder command moving the entry to the target index", () => {
    const step = makeStep([makeEntry({ id: "a" }), makeEntry({ id: "b" }), makeEntry({ id: "c" })]);

    const command = buildReorderCommand(step, 4, "a", 2);

    expect(command).toMatchObject({
      type: "entries.reorder",
      stepId: 4,
      before: ["a", "b", "c"],
      after: ["b", "c", "a"],
    });
  });

  it("returns null when the entry is already at the target position", () => {
    const step = makeStep([makeEntry({ id: "a" }), makeEntry({ id: "b" })]);
    expect(buildReorderCommand(step, 4, "a", 0)).toBeNull();
  });
});

describe("buildSetA3VisibilityCommand", () => {
  it("builds an entry.setA3Visibility command with the resolved before value", () => {
    const step = makeStep([makeEntry({ id: "a", a3Visibility: "primary" })]);

    const command = buildSetA3VisibilityCommand(step, 4, "a", "appendix");

    expect(command).toMatchObject({
      type: "entry.setA3Visibility",
      stepId: 4,
      entryId: "a",
      before: "primary",
      after: "appendix",
    });
  });
});
