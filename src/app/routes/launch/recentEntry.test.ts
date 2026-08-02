import { describe, expect, test } from "vitest";
import { createNewProject } from "../../../domain/model";
import { buildRecentEntryMeta, RecentEntryMetaSchema } from "./recentEntry";

describe("buildRecentEntryMeta", () => {
  test("produces an entry that passes RecentEntryMetaSchema", () => {
    const { manifest, project } = createNewProject({ title: "Test", language: "en", appVersion: "0.1.0" });

    const entry = buildRecentEntryMeta(manifest, project, "/tmp/test.ppsx");

    expect(RecentEntryMetaSchema.safeParse(entry).success).toBe(true);
  });

  test("carries the path, title, and manifest.modified as lastModified", () => {
    const { manifest, project } = createNewProject({ title: "Şişli Hattı", language: "tr", appVersion: "0.1.0" });

    const entry = buildRecentEntryMeta(manifest, project, "/tmp/test.ppsx");

    expect(entry.path).toBe("/tmp/test.ppsx");
    expect(entry.title).toBe("Şişli Hattı");
    expect(entry.lastModified).toBe(manifest.modified);
  });

  test("currentStep is 0 for a freshly-created project with no entries", () => {
    const { manifest, project } = createNewProject({ title: "Test", language: "en", appVersion: "0.1.0" });

    const entry = buildRecentEntryMeta(manifest, project, "/tmp/test.ppsx");

    expect(entry.currentStep).toBe(0);
  });

  test("currentStep counts steps that have at least one entry", () => {
    const { manifest, project } = createNewProject({ title: "Test", language: "en", appVersion: "0.1.0" });
    const withEntries = {
      ...project,
      steps: {
        ...project.steps,
        1: { entries: [{ id: "e1" }] },
        4: { entries: [{ id: "e2" }] },
      },
    };

    const entry = buildRecentEntryMeta(manifest, withEntries as typeof project, "/tmp/test.ppsx");

    expect(entry.currentStep).toBe(2);
  });

  test("falls back to undefined customer/owner when meta fields are empty", () => {
    const { manifest, project } = createNewProject({ title: "Test", language: "en", appVersion: "0.1.0" });

    const entry = buildRecentEntryMeta(manifest, project, "/tmp/test.ppsx");

    expect(entry.customer).toBeUndefined();
    expect(entry.owner).toBeUndefined();
  });
});
