import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const checkForUpdateMock = vi.fn();
const installUpdateAndRelaunchMock = vi.fn();

vi.mock("./updateIpc", () => ({
  checkForUpdate: (...args: unknown[]) => checkForUpdateMock(...args),
  installUpdateAndRelaunch: (...args: unknown[]) => installUpdateAndRelaunchMock(...args),
}));

import { useUpdateCheck } from "./useUpdateCheck";

beforeEach(() => {
  checkForUpdateMock.mockReset();
  installUpdateAndRelaunchMock.mockReset();
});

describe("useUpdateCheck", () => {
  it("starts idle and never calls checkForUpdate on its own", () => {
    const { result } = renderHook(() => useUpdateCheck());
    expect(result.current.state).toEqual({ status: "idle" });
    expect(checkForUpdateMock).not.toHaveBeenCalled();
  });

  it("goes checking -> upToDate when check() resolves null", async () => {
    checkForUpdateMock.mockResolvedValue(null);
    const { result } = renderHook(() => useUpdateCheck());

    act(() => {
      void result.current.checkNow();
    });
    expect(result.current.state).toEqual({ status: "checking" });

    await waitFor(() => expect(result.current.state).toEqual({ status: "upToDate" }));
  });

  it("goes checking -> available, carrying the update's version fields", async () => {
    checkForUpdateMock.mockResolvedValue({
      version: "1.3.0",
      currentVersion: "1.2.0",
      body: "Bug fixes.",
      downloadAndInstall: vi.fn(),
    });
    const { result } = renderHook(() => useUpdateCheck());

    await act(async () => {
      await result.current.checkNow();
    });

    expect(result.current.state).toEqual({
      status: "available",
      version: "1.3.0",
      currentVersion: "1.2.0",
      body: "Bug fixes.",
    });
  });

  it("surfaces a check() rejection as a readable error state", async () => {
    checkForUpdateMock.mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useUpdateCheck());

    await act(async () => {
      await result.current.checkNow();
    });

    expect(result.current.state).toEqual({ status: "error", message: "offline" });
  });

  it("installNow is a no-op when nothing was ever found available", async () => {
    const { result } = renderHook(() => useUpdateCheck());

    await act(async () => {
      await result.current.installNow();
    });

    expect(result.current.state).toEqual({ status: "idle" });
    expect(installUpdateAndRelaunchMock).not.toHaveBeenCalled();
  });

  it("installNow goes downloading, then calls installUpdateAndRelaunch with the found update", async () => {
    const fakeUpdate = { version: "1.3.0", currentVersion: "1.2.0", body: undefined };
    checkForUpdateMock.mockResolvedValue(fakeUpdate);
    installUpdateAndRelaunchMock.mockResolvedValue(undefined);
    const { result } = renderHook(() => useUpdateCheck());

    await act(async () => {
      await result.current.checkNow();
    });

    act(() => {
      void result.current.installNow();
    });
    expect(result.current.state).toEqual({ status: "downloading" });

    await waitFor(() => expect(installUpdateAndRelaunchMock).toHaveBeenCalledWith(fakeUpdate));
  });

  it("surfaces an installUpdateAndRelaunch rejection (e.g. a failed download) as an error state", async () => {
    checkForUpdateMock.mockResolvedValue({ version: "1.3.0", currentVersion: "1.2.0", body: undefined });
    installUpdateAndRelaunchMock.mockRejectedValue(new Error("disk full"));
    const { result } = renderHook(() => useUpdateCheck());

    await act(async () => {
      await result.current.checkNow();
    });
    await act(async () => {
      await result.current.installNow();
    });

    expect(result.current.state).toEqual({ status: "error", message: "disk full" });
  });
});
