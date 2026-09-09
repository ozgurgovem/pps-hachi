import { describe, expect, test, vi } from "vitest";
import { installE2eInvokeMockBridge, type WdioBridgeWindow } from "./e2eInvokeMockBridge";

describe("installE2eInvokeMockBridge", () => {
  test("routes a mocked command through window.__wdio_mocks__ instead of the real invoke", () => {
    const realInvoke = vi.fn().mockReturnValue("real-result");
    const target: WdioBridgeWindow = { __TAURI_INTERNALS__: { invoke: realInvoke } };
    installE2eInvokeMockBridge(target);

    const mockFn = vi.fn().mockReturnValue("mocked-result");
    target.__wdio_mocks__ = { "plugin:dialog|save": mockFn };

    const result = target.__TAURI_INTERNALS__?.invoke("plugin:dialog|save", { options: {} });

    expect(result).toBe("mocked-result");
    expect(mockFn).toHaveBeenCalledWith({ options: {} });
    expect(realInvoke).not.toHaveBeenCalled();
  });

  test("falls through to the real invoke when no mock is registered for the command", () => {
    const realInvoke = vi.fn().mockReturnValue("real-result");
    const target: WdioBridgeWindow = { __TAURI_INTERNALS__: { invoke: realInvoke } };
    installE2eInvokeMockBridge(target);
    target.__wdio_mocks__ = { "plugin:dialog|save": vi.fn() };

    const result = target.__TAURI_INTERNALS__?.invoke("ppsx_write", { path: "/tmp/x.ppsx" });

    expect(result).toBe("real-result");
    expect(realInvoke).toHaveBeenCalledWith("ppsx_write", { path: "/tmp/x.ppsx" }, undefined);
  });

  test("falls through to the real invoke when window.__wdio_mocks__ was never populated", () => {
    const realInvoke = vi.fn().mockReturnValue("real-result");
    const target: WdioBridgeWindow = { __TAURI_INTERNALS__: { invoke: realInvoke } };
    installE2eInvokeMockBridge(target);

    const result = target.__TAURI_INTERNALS__?.invoke("get_platform_info");

    expect(result).toBe("real-result");
    expect(realInvoke).toHaveBeenCalledWith("get_platform_info", undefined, undefined);
  });

  test("is idempotent — installing twice does not wrap the wrapper", () => {
    const realInvoke = vi.fn().mockReturnValue("real-result");
    const target: WdioBridgeWindow = { __TAURI_INTERNALS__: { invoke: realInvoke } };
    installE2eInvokeMockBridge(target);
    const wrappedOnce = target.__TAURI_INTERNALS__?.invoke;

    installE2eInvokeMockBridge(target);

    expect(target.__TAURI_INTERNALS__?.invoke).toBe(wrappedOnce);
  });

  test("does nothing when window.__TAURI_INTERNALS__ is not present", () => {
    const target: WdioBridgeWindow = {};
    expect(() => installE2eInvokeMockBridge(target)).not.toThrow();
    expect(target.__TAURI_INTERNALS__).toBeUndefined();
  });
});
