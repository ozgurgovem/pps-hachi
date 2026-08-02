import { describe, expect, test, vi } from "vitest";
import { createProjectAtPath } from "./createProjectFlow";
import { upsertRecentProject, writePpsx } from "./ppsxIpc";

vi.mock("./ppsxIpc", () => ({
  writePpsx: vi.fn(),
  upsertRecentProject: vi.fn(),
}));

const mockWrite = vi.mocked(writePpsx);
const mockUpsert = vi.mocked(upsertRecentProject);

describe("createProjectAtPath", () => {
  test("writes a fresh project to the given path", async () => {
    mockWrite.mockResolvedValueOnce({ modifiedMs: 1000 });
    mockUpsert.mockResolvedValueOnce([]);

    await createProjectAtPath("/tmp/new.ppsx", { title: "New", language: "en", appVersion: "0.1.0" });

    expect(mockWrite).toHaveBeenCalledWith(
      "/tmp/new.ppsx",
      expect.objectContaining({ schemaVersion: 1 }),
      expect.objectContaining({ meta: expect.objectContaining({ title: "New" }) }),
      [],
    );
  });

  test("returns the manifest, project, path and modifiedMs it just created", async () => {
    mockWrite.mockResolvedValueOnce({ modifiedMs: 4242 });
    mockUpsert.mockResolvedValueOnce([]);

    const outcome = await createProjectAtPath("/tmp/new.ppsx", { title: "New", language: "en", appVersion: "0.1.0" });

    expect(outcome.path).toBe("/tmp/new.ppsx");
    expect(outcome.manifest.id).toBe(outcome.project.id);
    expect(outcome.otherEntries).toEqual([]);
    expect(outcome.modifiedMs).toBe(4242);
  });

  test("updates the recent list after a successful write", async () => {
    mockWrite.mockResolvedValueOnce({ modifiedMs: 1000 });
    mockUpsert.mockResolvedValueOnce([]);

    await createProjectAtPath("/tmp/new.ppsx", { title: "New", language: "en", appVersion: "0.1.0" });

    expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({ path: "/tmp/new.ppsx", title: "New" }));
  });

  test("propagates a write failure instead of swallowing it", async () => {
    mockWrite.mockRejectedValueOnce(new Error("disk full"));

    await expect(
      createProjectAtPath("/tmp/new.ppsx", { title: "New", language: "en", appVersion: "0.1.0" }),
    ).rejects.toThrow("disk full");
  });

  test("a failed recent-list update does not prevent the create from succeeding", async () => {
    mockWrite.mockResolvedValueOnce({ modifiedMs: 1000 });
    mockUpsert.mockRejectedValueOnce(new Error("disk full"));

    const outcome = await createProjectAtPath("/tmp/new.ppsx", { title: "New", language: "en", appVersion: "0.1.0" });

    expect(outcome.path).toBe("/tmp/new.ppsx");
  });
});
