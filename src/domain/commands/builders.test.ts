import { describe, expect, it } from "vitest";
import type { Entry, ProjectModel, Round, StepState } from "../model";
import { createNewProject } from "../model";
import {
  buildAddEntryCommand,
  buildDeleteEntryCommand,
  buildDuplicateEntryCommand,
  buildOpenRoundCommand,
  buildReorderCommand,
  buildSetA3VisibilityCommand,
  buildSetAiMetaCommand,
  buildSetProjectInfoCommand,
  buildSetSignOffCommand,
  buildSetTemplateIdCommand,
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

  it("carries roundId onto the new entry when provided", () => {
    const step = makeStep([]);

    const command = buildAddEntryCommand(step, 4, {
      methodId: "generic-text",
      title: "New",
      payload: {},
      now: "2026-08-02T01:00:00.000Z",
      roundId: "r1",
    });

    expect(command.entry.roundId).toBe("r1");
  });

  it("omits roundId entirely when not provided", () => {
    const step = makeStep([]);

    const command = buildAddEntryCommand(step, 4, {
      methodId: "generic-text",
      title: "New",
      payload: {},
      now: "2026-08-02T01:00:00.000Z",
    });

    expect("roundId" in command.entry).toBe(false);
  });

  it("defaults provenance to human-origin when not provided", () => {
    const step = makeStep([]);

    const command = buildAddEntryCommand(step, 4, {
      methodId: "generic-text",
      title: "New",
      payload: {},
      now: "2026-08-02T01:00:00.000Z",
    });

    expect(command.entry.provenance).toEqual({ origin: "human" });
  });

  it("carries an explicit AI-accepted provenance onto the new entry (D-15/D-201)", () => {
    const step = makeStep([]);

    const command = buildAddEntryCommand(step, 4, {
      methodId: "generic-text",
      title: "New",
      payload: { text: "assistant reply" },
      now: "2026-08-31T01:00:00.000Z",
      provenance: {
        origin: "ai-accepted",
        model: { providerId: "vorion", modelId: "openai/gpt-4o", promptVersion: "bare-chat-v1" },
        generatedAt: "2026-08-31T00:59:00.000Z",
        acceptedAt: "2026-08-31T01:00:00.000Z",
      },
    });

    expect(command.entry.provenance).toEqual({
      origin: "ai-accepted",
      model: { providerId: "vorion", modelId: "openai/gpt-4o", promptVersion: "bare-chat-v1" },
      generatedAt: "2026-08-31T00:59:00.000Z",
      acceptedAt: "2026-08-31T01:00:00.000Z",
    });
  });

  it("carries images imported before save onto the new entry", () => {
    const step = makeStep([]);

    const command = buildAddEntryCommand(step, 2, {
      methodId: "gemba-observation-log",
      title: "New",
      payload: {},
      now: "2026-08-02T01:00:00.000Z",
      images: [{ id: "img-1", assetPath: "assets/img_img-1.jpg" }],
    });

    expect(command.entry.images).toEqual([{ id: "img-1", assetPath: "assets/img_img-1.jpg" }]);
  });

  it("starts with an empty images array when none are provided", () => {
    const step = makeStep([]);

    const command = buildAddEntryCommand(step, 4, {
      methodId: "generic-text",
      title: "New",
      payload: {},
      now: "2026-08-02T01:00:00.000Z",
    });

    expect(command.entry.images).toEqual([]);
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

  it("leaves an existing roundId alone when the input omits it", () => {
    const step = makeStep([makeEntry({ id: "a", roundId: "r1" })]);

    const command = buildUpdateEntryCommand(step, 4, "a", {
      title: "Renamed",
      payload: {},
      now: "2026-08-02T02:00:00.000Z",
    });

    expect(command.after.roundId).toBe("r1");
  });

  it("sets roundId when the input provides one", () => {
    const step = makeStep([makeEntry({ id: "a" })]);

    const command = buildUpdateEntryCommand(step, 4, "a", {
      title: "Renamed",
      payload: {},
      now: "2026-08-02T02:00:00.000Z",
      roundId: "r2",
    });

    expect(command.after.roundId).toBe("r2");
  });

  it("clears roundId when the input explicitly passes null", () => {
    const step = makeStep([makeEntry({ id: "a", roundId: "r1" })]);

    const command = buildUpdateEntryCommand(step, 4, "a", {
      title: "Renamed",
      payload: {},
      now: "2026-08-02T02:00:00.000Z",
      roundId: null,
    });

    expect(command.after.roundId).toBeUndefined();
    expect("roundId" in command.after).toBe(false);
  });

  it("leaves existing images alone when the input omits them", () => {
    const step = makeStep([makeEntry({ id: "a", images: [{ id: "img-1", assetPath: "x" }] })]);

    const command = buildUpdateEntryCommand(step, 4, "a", {
      title: "Renamed",
      payload: {},
      now: "2026-08-02T02:00:00.000Z",
    });

    expect(command.after.images).toEqual([{ id: "img-1", assetPath: "x" }]);
  });

  it("replaces images when the input provides a new list", () => {
    const step = makeStep([makeEntry({ id: "a", images: [{ id: "img-1", assetPath: "x" }] })]);

    const command = buildUpdateEntryCommand(step, 4, "a", {
      title: "Renamed",
      payload: {},
      now: "2026-08-02T02:00:00.000Z",
      images: [
        { id: "img-1", assetPath: "x" },
        { id: "img-2", assetPath: "y", role: "after" },
      ],
    });

    expect(command.after.images).toEqual([
      { id: "img-1", assetPath: "x" },
      { id: "img-2", assetPath: "y", role: "after" },
    ]);
  });

  it("clears images when the input explicitly passes an empty array", () => {
    const step = makeStep([makeEntry({ id: "a", images: [{ id: "img-1", assetPath: "x" }] })]);

    const command = buildUpdateEntryCommand(step, 4, "a", {
      title: "Renamed",
      payload: {},
      now: "2026-08-02T02:00:00.000Z",
      images: [],
    });

    expect(command.after.images).toEqual([]);
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

function makeProject(rounds: Round[] = []): ProjectModel {
  const { project } = createNewProject({ title: "Test", language: "en", appVersion: "0.1.0" });
  return { ...project, rounds };
}

describe("buildOpenRoundCommand", () => {
  it("appends a fresh round when none are open", () => {
    const project = makeProject([]);

    const command = buildOpenRoundCommand(project, "target not met", "2026-08-18T00:00:00.000Z");

    expect(command).toMatchObject({ type: "rounds.set", before: [], undoable: true });
    expect(command.after).toHaveLength(1);
    expect(command.after[0]).toMatchObject({
      reason: "target not met",
      openedAt: "2026-08-18T00:00:00.000Z",
    });
    expect(command.after[0]?.id).toBeTruthy();
  });

  it("closes any still-open round while opening the new one", () => {
    const openRound: Round = { id: "r1", openedAt: "2026-08-01T00:00:00.000Z", reason: "first" };
    const project = makeProject([openRound]);

    const command = buildOpenRoundCommand(project, "second pass", "2026-08-18T00:00:00.000Z");

    expect(command.after).toHaveLength(2);
    expect(command.after[0]).toMatchObject({ id: "r1", closedAt: "2026-08-18T00:00:00.000Z" });
    expect(command.after[1]).toMatchObject({ reason: "second pass" });
  });

  it("leaves an already-closed round untouched", () => {
    const closedRound: Round = {
      id: "r1",
      openedAt: "2026-08-01T00:00:00.000Z",
      closedAt: "2026-08-05T00:00:00.000Z",
      reason: "first",
    };
    const project = makeProject([closedRound]);

    const command = buildOpenRoundCommand(project, "second pass", "2026-08-18T00:00:00.000Z");

    expect(command.after[0]).toEqual(closedRound);
  });
});

describe("buildSetSignOffCommand", () => {
  it("sets the given role, leaving other roles untouched", () => {
    const project = makeProject();
    project.signOff.reviewedBy = { name: "Existing", signedAt: "2026-08-01T00:00:00.000Z" };

    const command = buildSetSignOffCommand(project, "preparedBy", {
      name: "Ada",
      signedAt: "2026-08-18T00:00:00.000Z",
    });

    expect(command).toMatchObject({ type: "signOff.set", undoable: true });
    expect(command.after).toMatchObject({
      preparedBy: { name: "Ada", signedAt: "2026-08-18T00:00:00.000Z" },
      reviewedBy: { name: "Existing", signedAt: "2026-08-01T00:00:00.000Z" },
    });
  });

  it("clears a role when given undefined", () => {
    const project = makeProject();
    project.signOff.approvedBy = { name: "Ada", signedAt: "2026-08-18T00:00:00.000Z" };

    const command = buildSetSignOffCommand(project, "approvedBy", undefined);

    expect("approvedBy" in command.after).toBe(false);
  });
});

describe("buildSetAiMetaCommand", () => {
  it("captures the project's current meta.ai as before and the given value as after", () => {
    const project = makeProject();

    const command = buildSetAiMetaCommand(project, {
      enabled: true,
      providerId: "vorion",
      modelId: "openai/gpt-4o",
      redaction: {},
    });

    expect(command).toEqual({
      type: "meta.ai.set",
      before: project.meta.ai,
      after: { enabled: true, providerId: "vorion", modelId: "openai/gpt-4o", redaction: {} },
      undoable: true,
    });
  });
});

describe("buildSetProjectInfoCommand (Faz 11/L1, D-224)", () => {
  it("captures the project's current priority/targetClosureDate/generalRag as before and the given value as after", () => {
    const project = makeProject();

    const command = buildSetProjectInfoCommand(project, {
      priority: "high",
      targetClosureDate: "2026-12-01",
      generalRag: "amber",
    });

    expect(command).toEqual({
      type: "meta.projectInfo.set",
      before: {
        priority: project.meta.priority,
        targetClosureDate: project.meta.targetClosureDate,
        generalRag: project.meta.generalRag,
      },
      after: { priority: "high", targetClosureDate: "2026-12-01", generalRag: "amber" },
      undoable: true,
    });
  });
});

describe("buildSetTemplateIdCommand (Faz 11/L2)", () => {
  it("captures the project's current templateId as before and the given id as after", () => {
    const project = makeProject();

    const command = buildSetTemplateIdCommand(project, "farplas-7step-tr");

    expect(command).toEqual({
      type: "templateId.set",
      before: project.templateId,
      after: "farplas-7step-tr",
      undoable: true,
    });
  });
});
