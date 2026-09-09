import { beforeEach, describe, expect, it, vi } from "vitest";

const checkMock = vi.fn();
vi.mock("@tauri-apps/plugin-updater", () => ({
  check: (...args: unknown[]) => checkMock(...args),
}));

const relaunchMock = vi.fn();
vi.mock("@tauri-apps/plugin-process", () => ({
  relaunch: (...args: unknown[]) => relaunchMock(...args),
}));

import { checkForUpdate, installUpdateAndRelaunch } from "./updateIpc";

beforeEach(() => {
  checkMock.mockReset();
  relaunchMock.mockReset();
});

describe("checkForUpdate", () => {
  it("passes through whatever the plugin's check() resolves to", async () => {
    checkMock.mockResolvedValue(null);
    await expect(checkForUpdate()).resolves.toBeNull();

    const fakeUpdate = { version: "1.2.0" };
    checkMock.mockResolvedValue(fakeUpdate);
    await expect(checkForUpdate()).resolves.toBe(fakeUpdate);
  });
});

describe("installUpdateAndRelaunch", () => {
  it("downloads and installs the update, then relaunches", async () => {
    const downloadAndInstall = vi.fn().mockResolvedValue(undefined);
    const fakeUpdate = { downloadAndInstall } as unknown as import("@tauri-apps/plugin-updater").Update;

    await installUpdateAndRelaunch(fakeUpdate);

    expect(downloadAndInstall).toHaveBeenCalledTimes(1);
    expect(relaunchMock).toHaveBeenCalledTimes(1);
  });

  it("propagates a downloadAndInstall failure without calling relaunch", async () => {
    const downloadAndInstall = vi.fn().mockRejectedValue(new Error("network down"));
    const fakeUpdate = { downloadAndInstall } as unknown as import("@tauri-apps/plugin-updater").Update;

    await expect(installUpdateAndRelaunch(fakeUpdate)).rejects.toThrow("network down");
    expect(relaunchMock).not.toHaveBeenCalled();
  });
});
