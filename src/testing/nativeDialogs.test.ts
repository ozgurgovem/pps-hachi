import { afterEach, describe, expect, test, vi } from "vitest";
import { save as realSave, open as realOpen } from "@tauri-apps/plugin-dialog";

vi.mock("@tauri-apps/plugin-dialog", () => ({ save: vi.fn(), open: vi.fn() }));

const mockRealSave = vi.mocked(realSave);
const mockRealOpen = vi.mocked(realOpen);

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  delete (window as unknown as { __e2e_dialog_mocks__?: unknown }).__e2e_dialog_mocks__;
  vi.resetModules();
});

describe("nativeDialogs", () => {
  test("calls the real save() in a normal (non-e2e) build, ignoring any window mock", async () => {
    vi.stubEnv("MODE", "test");
    mockRealSave.mockResolvedValue("/real/path.ppsx");
    (window as unknown as { __e2e_dialog_mocks__?: unknown }).__e2e_dialog_mocks__ = {
      save: vi.fn().mockResolvedValue("/should-not-be-used.ppsx"),
    };
    const { save } = await import("./nativeDialogs");

    const result = await save({ defaultPath: "Untitled.ppsx" });

    expect(result).toBe("/real/path.ppsx");
    expect(mockRealSave).toHaveBeenCalledWith({ defaultPath: "Untitled.ppsx" });
  });

  test("D-251/CI-kirmizi-durum-devam-2.md: in e2e mode, a registered window mock intercepts save() instead of the real dialog", async () => {
    vi.stubEnv("MODE", "e2e");
    const mockSave = vi.fn().mockResolvedValue("/mocked/path.ppsx");
    (window as unknown as { __e2e_dialog_mocks__?: unknown }).__e2e_dialog_mocks__ = { save: mockSave };
    const { save } = await import("./nativeDialogs");

    const result = await save({ defaultPath: "Untitled.ppsx" });

    expect(result).toBe("/mocked/path.ppsx");
    expect(mockSave).toHaveBeenCalledWith({ defaultPath: "Untitled.ppsx" });
    expect(mockRealSave).not.toHaveBeenCalled();
  });

  test("in e2e mode with no mock registered, falls through to the real save() (e.g. photo/file pickers this session deliberately left unwrapped)", async () => {
    vi.stubEnv("MODE", "e2e");
    mockRealSave.mockResolvedValue("/real/fallback.ppsx");
    const { save } = await import("./nativeDialogs");

    const result = await save();

    expect(result).toBe("/real/fallback.ppsx");
  });

  test("in e2e mode, a registered window mock intercepts open() instead of the real dialog", async () => {
    vi.stubEnv("MODE", "e2e");
    const mockOpen = vi.fn().mockResolvedValue("/mocked/opened.ppsx");
    (window as unknown as { __e2e_dialog_mocks__?: unknown }).__e2e_dialog_mocks__ = { open: mockOpen };
    const { open } = await import("./nativeDialogs");

    const result = await open({ multiple: false });

    expect(result).toBe("/mocked/opened.ppsx");
    expect(mockOpen).toHaveBeenCalledWith({ multiple: false });
    expect(mockRealOpen).not.toHaveBeenCalled();
  });
});
