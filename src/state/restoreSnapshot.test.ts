import { describe, expect, it } from "vitest";
import { createNewProject } from "../domain/model";
import { resolveSnapshotForRestore } from "./restoreSnapshot";

describe("resolveSnapshotForRestore", () => {
  it("accepts a valid snapshot belonging to the current project", () => {
    const { project } = createNewProject({ title: "Test", language: "en", appVersion: "0.1.0" });

    const result = resolveSnapshotForRestore(project, project.id);

    expect(result).toMatchObject({ ok: true, project: { id: project.id } });
  });

  it("rejects a snapshot with no parseable schemaVersion", () => {
    const result = resolveSnapshotForRestore({ not: "a project" }, "any-id");
    expect(result.ok).toBe(false);
  });

  it("rejects a snapshot whose shape fails ProjectModel validation", () => {
    const result = resolveSnapshotForRestore({ schemaVersion: 1, id: "p1" }, "p1");
    expect(result.ok).toBe(false);
  });

  it("rejects a snapshot belonging to a different project", () => {
    const { project } = createNewProject({ title: "Test", language: "en", appVersion: "0.1.0" });

    const result = resolveSnapshotForRestore(project, "some-other-project-id");

    expect(result).toMatchObject({ ok: false });
  });
});
