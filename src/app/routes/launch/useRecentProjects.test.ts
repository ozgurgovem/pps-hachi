import { afterEach, describe, expect, test, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { listRecentProjects } from "./ppsxIpc";
import type { RecentEntryMeta } from "./recentEntry";
import { useRecentProjects } from "./useRecentProjects";

vi.mock("./ppsxIpc", () => ({
  listRecentProjects: vi.fn(),
}));

const mockList = vi.mocked(listRecentProjects);

const validEntry = { path: "/tmp/a.ppsx", title: "A", currentStep: 2, lastModified: "2026-08-02T00:00:00.000Z" };

afterEach(() => {
  vi.clearAllMocks();
});

describe("useRecentProjects", () => {
  test("starts loading, then exposes the fetched entries", async () => {
    mockList.mockResolvedValueOnce([validEntry]);

    const { result } = renderHook(() => useRecentProjects());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.entries).toEqual([validEntry]);
    expect(result.current.error).toBeNull();
  });

  test("drops cached rows that no longer match the expected shape", async () => {
    // Simulates a malformed runtime row (older cache, disk corruption) that
    // the wrapper's optimistic return type can't express at compile time.
    const malformed = { path: "/tmp/bad.ppsx" } as unknown as RecentEntryMeta;
    mockList.mockResolvedValueOnce([validEntry, malformed]);

    const { result } = renderHook(() => useRecentProjects());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.entries).toEqual([validEntry]);
  });

  test("surfaces an error message when the list call itself fails", async () => {
    mockList.mockRejectedValueOnce(new Error("app-local-data-dir unavailable"));

    const { result } = renderHook(() => useRecentProjects());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe("app-local-data-dir unavailable");
    expect(result.current.entries).toEqual([]);
  });

  test("refresh() re-fetches the list", async () => {
    mockList.mockResolvedValueOnce([]).mockResolvedValueOnce([validEntry]);

    const { result } = renderHook(() => useRecentProjects());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.entries).toEqual([]);

    result.current.refresh();

    await waitFor(() => expect(result.current.entries).toEqual([validEntry]));
    expect(mockList).toHaveBeenCalledTimes(2);
  });
});
