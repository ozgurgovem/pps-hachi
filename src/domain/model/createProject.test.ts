import { describe, expect, test } from "vitest";
import { createNewProject } from "./createProject";
import { ManifestSchema } from "./manifest";
import { ProjectModelSchema } from "./projectModel";

describe("createNewProject", () => {
  test("produces a manifest and project that both pass their schemas", () => {
    const { manifest, project } = createNewProject({ title: "Test", language: "en", appVersion: "0.1.0" });

    expect(ManifestSchema.safeParse(manifest).success).toBe(true);
    expect(ProjectModelSchema.safeParse(project).success).toBe(true);
  });

  // D-54: manifest and project.json must agree on id and schemaVersion, or the
  // file is corrupt. Sharing one generation path makes disagreement impossible.
  test("gives the manifest and the project the same id and schemaVersion", () => {
    const { manifest, project } = createNewProject({ title: "Test", language: "en", appVersion: "0.1.0" });

    expect(manifest.id).toBe(project.id);
    expect(manifest.schemaVersion).toBe(project.schemaVersion);
  });

  test("two projects created back to back get different ids", () => {
    const first = createNewProject({ title: "A", language: "en", appVersion: "0.1.0" });
    const second = createNewProject({ title: "B", language: "en", appVersion: "0.1.0" });

    expect(first.manifest.id).not.toBe(second.manifest.id);
  });

  // Faz 11/L1 (D-157/D-223): the default moved from farplas-7step-tr to
  // pps-8step-auto once the Rev00-based template existed. Kept in sync with
  // `src/a3/templates/registry.ts`'s own `DEFAULT_TEMPLATE_ID` by a
  // dedicated cross-check test in `src/a3/templates/registry.test.ts`
  // (this file can't import `src/a3` — see `createProject.ts`'s own note).
  test("defaults to the D-157 default template", () => {
    const { project } = createNewProject({ title: "Test", language: "tr", appVersion: "0.1.0" });
    expect(project.templateId).toBe("pps-8step-auto");
  });

  test("all 8 steps start with an empty entries array", () => {
    const { project } = createNewProject({ title: "Test", language: "tr", appVersion: "0.1.0" });
    for (let step = 1; step <= 8; step += 1) {
      expect(project.steps[step as keyof typeof project.steps].entries).toEqual([]);
    }
  });
});
