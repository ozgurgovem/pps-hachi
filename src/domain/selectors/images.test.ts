import { describe, expect, it } from "vitest";
import type { Entry, ProjectModel } from "../model";
import { createNewProject } from "../model/createProject";
import { findEntryImage } from "./images";

const NOW = "2026-08-19T10:00:00.000Z";

function baseEntry(overrides: Partial<Entry>): Entry {
  return {
    id: "entry-1",
    methodId: "gemba-observation-log",
    title: "Gemba walk",
    order: 0,
    a3Visibility: "primary",
    payload: {},
    images: [],
    createdAt: NOW,
    updatedAt: NOW,
    provenance: { origin: "human" },
    ...overrides,
  };
}

function projectWithEntry(entry: Entry): ProjectModel {
  const { project } = createNewProject({ title: "T", language: "tr", appVersion: "0.0.0" });
  return {
    ...project,
    steps: {
      ...project.steps,
      2: { ...project.steps[2], entries: [entry] },
    },
  };
}

describe("findEntryImage", () => {
  it("finds an image by entry id and image id", () => {
    const entry = baseEntry({
      images: [
        { id: "img-1", assetPath: "assets/img_img-1.jpg" },
        { id: "img-2", assetPath: "assets/img_img-2.jpg", role: "before" },
      ],
    });
    const project = projectWithEntry(entry);

    expect(findEntryImage(project, "entry-1", "img-2")).toEqual({
      id: "img-2",
      assetPath: "assets/img_img-2.jpg",
      role: "before",
    });
  });

  it("returns undefined when the entry id does not exist", () => {
    const project = projectWithEntry(baseEntry({ images: [{ id: "img-1", assetPath: "x" }] }));
    expect(findEntryImage(project, "missing-entry", "img-1")).toBeUndefined();
  });

  it("returns undefined when the image id does not exist on that entry", () => {
    const project = projectWithEntry(baseEntry({ images: [{ id: "img-1", assetPath: "x" }] }));
    expect(findEntryImage(project, "entry-1", "missing-image")).toBeUndefined();
  });
});
