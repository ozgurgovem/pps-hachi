import { describe, expect, test, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import {
  listHistorySnapshots,
  listRecentProjects,
  PpsxWriteConflictError,
  readHistorySnapshot,
  readPpsx,
  saveHistorySnapshot,
  upsertRecentProject,
  writePpsx,
} from "./ppsxIpc";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

describe("ppsxIpc", () => {
  test("readPpsx invokes ppsx_read with the path", async () => {
    mockInvoke.mockResolvedValueOnce({ manifest: {}, project: {}, otherEntries: [], modifiedMs: 1 });

    await readPpsx("/tmp/project.ppsx");

    expect(mockInvoke).toHaveBeenCalledWith("ppsx_read", { path: "/tmp/project.ppsx" });
  });

  test("writePpsx invokes ppsx_write with path, manifest, project and otherEntries", async () => {
    mockInvoke.mockResolvedValueOnce({ modifiedMs: 2 });
    const manifest = { id: "p1" };
    const project = { id: "p1" };

    await writePpsx("/tmp/project.ppsx", manifest, project, []);

    expect(mockInvoke).toHaveBeenCalledWith("ppsx_write", {
      path: "/tmp/project.ppsx",
      manifest,
      project,
      otherEntries: [],
      expectedModifiedMs: undefined,
    });
  });

  test("writePpsx forwards a supplied otherEntries array", async () => {
    mockInvoke.mockResolvedValueOnce({ modifiedMs: 2 });
    const entries = [{ name: "assets/img_1.png", bytes: [1, 2, 3] }];

    await writePpsx("/tmp/project.ppsx", {}, {}, entries);

    expect(mockInvoke).toHaveBeenCalledWith(
      "ppsx_write",
      expect.objectContaining({ otherEntries: entries }),
    );
  });

  test("writePpsx forwards expectedModifiedMs and returns the new mtime", async () => {
    mockInvoke.mockResolvedValueOnce({ modifiedMs: 999 });

    const result = await writePpsx("/tmp/project.ppsx", {}, {}, [], 500);

    expect(mockInvoke).toHaveBeenCalledWith(
      "ppsx_write",
      expect.objectContaining({ expectedModifiedMs: 500 }),
    );
    expect(result).toEqual({ modifiedMs: 999 });
  });

  test("writePpsx maps a CONFLICT: error into PpsxWriteConflictError", async () => {
    mockInvoke.mockRejectedValueOnce("CONFLICT: file changed on disk (expected 1, found 2)");

    await expect(writePpsx("/tmp/project.ppsx", {}, {}, [], 1)).rejects.toBeInstanceOf(
      PpsxWriteConflictError,
    );
  });

  test("writePpsx re-throws a non-conflict error unchanged", async () => {
    mockInvoke.mockRejectedValueOnce("corrupt .ppsx: missing manifest.json");

    await expect(writePpsx("/tmp/project.ppsx", {}, {}, [])).rejects.not.toBeInstanceOf(
      PpsxWriteConflictError,
    );
  });

  test("listRecentProjects invokes recent_list with no arguments", async () => {
    mockInvoke.mockResolvedValueOnce([]);

    await listRecentProjects();

    expect(mockInvoke).toHaveBeenCalledWith("recent_list");
  });

  test("upsertRecentProject invokes recent_upsert with the entry", async () => {
    mockInvoke.mockResolvedValueOnce([]);
    const entry = { path: "/tmp/p.ppsx", title: "T", currentStep: 0, lastModified: "2026-08-02T00:00:00.000Z" };

    await upsertRecentProject(entry);

    expect(mockInvoke).toHaveBeenCalledWith("recent_upsert", { entry });
  });

  test("listHistorySnapshots invokes history_list with the project id", async () => {
    mockInvoke.mockResolvedValueOnce([]);

    await listHistorySnapshots("proj-1");

    expect(mockInvoke).toHaveBeenCalledWith("history_list", { projectId: "proj-1" });
  });

  test("saveHistorySnapshot invokes history_save with all fields", async () => {
    mockInvoke.mockResolvedValueOnce(undefined);
    const project = { id: "p1" };

    await saveHistorySnapshot("proj-1", "2026-08-02T090000Z", project, 20);

    expect(mockInvoke).toHaveBeenCalledWith("history_save", {
      projectId: "proj-1",
      timestamp: "2026-08-02T090000Z",
      project,
      keepLast: 20,
    });
  });

  test("readHistorySnapshot invokes history_read with the project id and timestamp", async () => {
    mockInvoke.mockResolvedValueOnce({ id: "p1" });

    await readHistorySnapshot("proj-1", "2026-08-02T090000Z");

    expect(mockInvoke).toHaveBeenCalledWith("history_read", {
      projectId: "proj-1",
      timestamp: "2026-08-02T090000Z",
    });
  });
});
