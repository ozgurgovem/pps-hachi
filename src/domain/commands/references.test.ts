import { describe, expect, it } from "vitest";
import type { StepState } from "../model";
import { applyCommand } from "./applyCommand";
import { buildAddEntryCommand, buildDeleteEntryCommand, buildUpdateEntryCommand } from "./builders";
import { invertCommand } from "./invertCommand";
import { createNewProject } from "../model/createProject";
import { findOrphanedReferences } from "../selectors";

const NOW = "2026-08-03T10:00:00.000Z";

function projectWithEntry() {
  const { project } = createNewProject({ title: "T", language: "tr", appVersion: "0.0.0" });
  const insert = buildAddEntryCommand(project.steps[2], 2, {
    methodId: "point-of-cause",
    title: "POC: station 30 gate",
    payload: {},
    now: NOW,
  });
  return { project: applyCommand(project, insert), targetId: insert.entry.id };
}

describe("references through the command layer", () => {
  it("stores no `references` key at all when a method declares none", () => {
    const { project, targetId } = projectWithEntry();
    const entry = project.steps[2].entries.find((e) => e.id === targetId);

    expect(entry && "references" in entry).toBe(false);
  });

  it("carries references onto a newly inserted entry", () => {
    const { project, targetId } = projectWithEntry();
    const insert = buildAddEntryCommand(project.steps[4], 4, {
      methodId: "hypothesis-verification",
      title: "Hypothesis table",
      payload: {},
      now: NOW,
      references: [{ role: "pointOfCause", targetEntryId: targetId }],
    });

    const next = applyCommand(project, insert);

    expect(next.steps[4].entries[0]?.references).toEqual([{ role: "pointOfCause", targetEntryId: targetId }]);
  });

  it("leaves existing references untouched when an update omits them", () => {
    const { project, targetId } = projectWithEntry();
    const insert = buildAddEntryCommand(project.steps[4], 4, {
      methodId: "hypothesis-verification",
      title: "Hypothesis table",
      payload: {},
      now: NOW,
      references: [{ role: "pointOfCause", targetEntryId: targetId }],
    });
    const withEntry = applyCommand(project, insert);

    const titleEdit = buildUpdateEntryCommand(withEntry.steps[4], 4, insert.entry.id, {
      title: "Renamed",
      payload: {},
      now: NOW,
    });
    const next = applyCommand(withEntry, titleEdit);

    expect(next.steps[4].entries[0]?.title).toBe("Renamed");
    expect(next.steps[4].entries[0]?.references).toEqual([{ role: "pointOfCause", targetEntryId: targetId }]);
  });

  it("clears the key entirely when an update passes an empty list", () => {
    const { project, targetId } = projectWithEntry();
    const insert = buildAddEntryCommand(project.steps[4], 4, {
      methodId: "hypothesis-verification",
      title: "H",
      payload: {},
      now: NOW,
      references: [{ role: "pointOfCause", targetEntryId: targetId }],
    });
    const withEntry = applyCommand(project, insert);

    const cleared = applyCommand(
      withEntry,
      buildUpdateEntryCommand(withEntry.steps[4], 4, insert.entry.id, {
        title: "H",
        payload: {},
        now: NOW,
        references: [],
      }),
    );
    const entry = cleared.steps[4].entries[0];

    expect(entry && "references" in entry).toBe(false);
  });

  /**
   * D-117's central claim, exercised end to end: deleting a referenced entry
   * is permitted, changes nothing on the referrer, and undo restores the
   * target so every reference resolves again with no compensating logic.
   */
  it("dangles on delete and resolves again on undo", () => {
    const { project, targetId } = projectWithEntry();
    const insert = buildAddEntryCommand(project.steps[4], 4, {
      methodId: "hypothesis-verification",
      title: "H",
      payload: {},
      now: NOW,
      references: [{ role: "pointOfCause", targetEntryId: targetId }],
    });
    const linked = applyCommand(project, insert);
    expect(findOrphanedReferences(linked)).toEqual([]);

    const remove = buildDeleteEntryCommand(linked.steps[2] as StepState, 2, targetId);
    const afterDelete = applyCommand(linked, remove);

    expect(afterDelete.steps[4].entries[0]?.references).toEqual([
      { role: "pointOfCause", targetEntryId: targetId },
    ]);
    expect(findOrphanedReferences(afterDelete)).toHaveLength(1);

    const afterUndo = applyCommand(afterDelete, invertCommand(remove));

    expect(findOrphanedReferences(afterUndo)).toEqual([]);
  });
});
