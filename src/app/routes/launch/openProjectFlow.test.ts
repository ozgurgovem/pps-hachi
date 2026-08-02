import { describe, expect, test, vi } from "vitest";
import { createNewProject } from "../../../domain/model";
import { openProjectAtPath } from "./openProjectFlow";
import { readPpsx, upsertRecentProject } from "./ppsxIpc";

vi.mock("./ppsxIpc", () => ({
  readPpsx: vi.fn(),
  upsertRecentProject: vi.fn(),
}));

const mockReadPpsx = vi.mocked(readPpsx);
const mockUpsert = vi.mocked(upsertRecentProject);

function validFixture() {
  const { manifest, project } = createNewProject({ title: "Test", language: "en", appVersion: "0.1.0" });
  return { manifest, project };
}

describe("openProjectAtPath", () => {
  test("opens a valid project at the current schema version, writable", async () => {
    const { manifest, project } = validFixture();
    mockReadPpsx.mockResolvedValueOnce({ manifest, project, otherEntries: [], modifiedMs: 1000 });
    mockUpsert.mockResolvedValueOnce([]);

    const outcome = await openProjectAtPath("/tmp/p.ppsx");

    expect(outcome).toMatchObject({ kind: "opened", path: "/tmp/p.ppsx", readOnly: false });
  });

  // D-79: nothing previously read `otherEntries`/`modifiedMs` back out of a
  // ppsx_read response — this is the exact gap the review found in shipped
  // Phase 2 code, verified fixed here.
  test("threads otherEntries and modifiedMs from the read straight into the outcome", async () => {
    const { manifest, project } = validFixture();
    const otherEntries = [{ name: "assets/img_1.png", bytes: [1, 2, 3] }];
    mockReadPpsx.mockResolvedValueOnce({ manifest, project, otherEntries, modifiedMs: 424242 });
    mockUpsert.mockResolvedValueOnce([]);

    const outcome = await openProjectAtPath("/tmp/p.ppsx");

    expect(outcome).toMatchObject({ kind: "opened", otherEntries, modifiedMs: 424242 });
  });

  test("updates the recent list on a successful open", async () => {
    const { manifest, project } = validFixture();
    mockReadPpsx.mockResolvedValueOnce({ manifest, project, otherEntries: [], modifiedMs: 1000 });
    mockUpsert.mockResolvedValueOnce([]);

    await openProjectAtPath("/tmp/p.ppsx");

    expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({ path: "/tmp/p.ppsx" }));
  });

  test("reports corrupt when manifest.json does not match the expected shape", async () => {
    const { project } = validFixture();
    mockReadPpsx.mockResolvedValueOnce({
      manifest: { not: "a manifest" },
      project,
      otherEntries: [],
      modifiedMs: 1000,
    });

    const outcome = await openProjectAtPath("/tmp/p.ppsx");

    expect(outcome.kind).toBe("corrupt");
  });

  test("reports corrupt when project.json does not match the expected shape", async () => {
    const { manifest } = validFixture();
    mockReadPpsx.mockResolvedValueOnce({
      manifest,
      project: { not: "a project" },
      otherEntries: [],
      modifiedMs: 1000,
    });

    const outcome = await openProjectAtPath("/tmp/p.ppsx");

    expect(outcome.kind).toBe("corrupt");
  });

  test("reports corrupt when the underlying read fails (bad zip, io error, etc.)", async () => {
    mockReadPpsx.mockRejectedValueOnce(new Error("corrupt .ppsx: missing manifest.json"));

    const outcome = await openProjectAtPath("/tmp/p.ppsx");

    expect(outcome).toMatchObject({ kind: "corrupt", reason: "corrupt .ppsx: missing manifest.json" });
  });

  // D-59: a file from a newer build opens read-only rather than being refused.
  test("opens read-only when manifest.schemaVersion is newer than this build understands", async () => {
    const { manifest, project } = validFixture();
    const newerManifest = { ...manifest, schemaVersion: 2 };
    mockReadPpsx.mockResolvedValueOnce({
      manifest: newerManifest,
      project,
      otherEntries: [],
      modifiedMs: 1000,
    });
    mockUpsert.mockResolvedValueOnce([]);

    const outcome = await openProjectAtPath("/tmp/p.ppsx");

    expect(outcome).toMatchObject({ kind: "opened", readOnly: true, readOnlyReason: "newer-schema" });
  });

  test("a newer-schema file with an invalid project shape is still reported corrupt", async () => {
    const { manifest } = validFixture();
    const newerManifest = { ...manifest, schemaVersion: 2 };
    mockReadPpsx.mockResolvedValueOnce({
      manifest: newerManifest,
      project: { nope: true },
      otherEntries: [],
      modifiedMs: 1000,
    });

    const outcome = await openProjectAtPath("/tmp/p.ppsx");

    expect(outcome.kind).toBe("corrupt");
  });

  test("a failed recent-list update does not prevent the project from opening", async () => {
    const { manifest, project } = validFixture();
    mockReadPpsx.mockResolvedValueOnce({ manifest, project, otherEntries: [], modifiedMs: 1000 });
    mockUpsert.mockRejectedValueOnce(new Error("disk full"));

    const outcome = await openProjectAtPath("/tmp/p.ppsx");

    expect(outcome.kind).toBe("opened");
  });
});
