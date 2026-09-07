import { describe, expect, it, vi, beforeEach } from "vitest";

const getByLabelMock = vi.fn();
const setFocusMock = vi.fn();
const onceMock = vi.fn();
const constructorCalls: Array<{ label: string; options: unknown }> = [];

vi.mock("@tauri-apps/api/webviewWindow", () => {
  class MockWebviewWindow {
    label: string;
    once = onceMock;
    setFocus = setFocusMock;
    static getByLabel = getByLabelMock;

    constructor(label: string, options?: unknown) {
      this.label = label;
      constructorCalls.push({ label, options });
    }
  }
  return { WebviewWindow: MockWebviewWindow };
});

const emitMock = vi.fn();
const emitToMock = vi.fn();
const listenMock = vi.fn();

vi.mock("@tauri-apps/api/event", () => ({
  emit: emitMock,
  emitTo: emitToMock,
  listen: listenMock,
}));

const {
  A3_PREVIEW_WINDOW_LABEL,
  A3_PREVIEW_DESCRIPTOR_EVENT,
  A3_PREVIEW_READY_EVENT,
  A3_PREVIEW_PIN_REQUEST_EVENT,
  openOrFocusA3PreviewWindow,
  pushDescriptorToPreviewWindow,
  listenForPreviewReady,
  listenForDescriptorPush,
  requestBlockPin,
  listenForBlockPinRequest,
} = await import("./window");

beforeEach(() => {
  getByLabelMock.mockReset().mockResolvedValue(null);
  setFocusMock.mockReset();
  onceMock.mockReset();
  emitMock.mockReset();
  emitToMock.mockReset();
  listenMock.mockReset().mockResolvedValue(vi.fn());
  constructorCalls.length = 0;
});

describe("openOrFocusA3PreviewWindow", () => {
  it("creates a new window at the expected label and route when none exists", async () => {
    await openOrFocusA3PreviewWindow();

    expect(constructorCalls).toHaveLength(1);
    expect(constructorCalls[0]?.label).toBe(A3_PREVIEW_WINDOW_LABEL);
    expect(constructorCalls[0]?.options).toMatchObject({ url: "index.html#/a3-preview" });
  });

  /** A second `WebviewWindow` with a label already in use throws — this must never happen. */
  it("focuses the existing window instead of constructing a second one", async () => {
    getByLabelMock.mockResolvedValue({ setFocus: setFocusMock });

    await openOrFocusA3PreviewWindow();

    expect(constructorCalls).toHaveLength(0);
    expect(setFocusMock).toHaveBeenCalledOnce();
  });

  /**
   * The exact bug found 2026-08-04: `default.json` granted the wrong
   * permission (`core:window:allow-create`, for a command this code never
   * calls) instead of the one `new WebviewWindow(...)` actually needs
   * (`core:webview:allow-create-webview-window`). The `invoke()` underneath
   * rejected, and since the button's `onClick` calls this with a bare
   * `void`, the rejection had nowhere to go — clicking did visibly nothing,
   * which read at first like a CSS hit-test bug. This test proves the
   * function itself never lets that happen again, independent of whether
   * the capability file is ever misconfigured the same way twice.
   */
  it("never lets a rejected getByLabel call escape as an unhandled rejection", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    getByLabelMock.mockRejectedValue(new Error("core:webview:allow-create-webview-window not permitted"));

    await expect(openOrFocusA3PreviewWindow()).resolves.toBeUndefined();

    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("never lets a rejected setFocus call escape as an unhandled rejection", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    setFocusMock.mockRejectedValue(new Error("core:window:allow-set-focus not permitted"));
    getByLabelMock.mockResolvedValue({ setFocus: setFocusMock });

    await expect(openOrFocusA3PreviewWindow()).resolves.toBeUndefined();

    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe("pushDescriptorToPreviewWindow", () => {
  const descriptor = { templateId: "t", language: "en", styles: [], sheets: {} } as never;

  it("does nothing when the preview window is not open", async () => {
    await pushDescriptorToPreviewWindow(descriptor);

    expect(emitToMock).not.toHaveBeenCalled();
  });

  it("emits the descriptor to the preview window's label when it is open", async () => {
    getByLabelMock.mockResolvedValue({});

    await pushDescriptorToPreviewWindow(descriptor);

    expect(emitToMock).toHaveBeenCalledWith(A3_PREVIEW_WINDOW_LABEL, A3_PREVIEW_DESCRIPTOR_EVENT, descriptor);
  });

  it("never lets a rejected emitTo call escape as an unhandled rejection", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    getByLabelMock.mockResolvedValue({});
    emitToMock.mockRejectedValue(new Error("denied"));

    await expect(pushDescriptorToPreviewWindow(descriptor)).resolves.toBeUndefined();

    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe("the ready handshake", () => {
  it("listenForPreviewReady subscribes to the ready event", async () => {
    await listenForPreviewReady(vi.fn());

    expect(listenMock).toHaveBeenCalledWith(A3_PREVIEW_READY_EVENT, expect.any(Function));
  });

  /**
   * Found while closing Phase 6c's quality gate: unlike its three siblings
   * above, this call had no try/catch — `RightPanel`'s mount effect invokes
   * it without `await`/`.catch`, so a rejected `listen()` (no Tauri runtime,
   * true of every test environment and any real failure) escaped as a
   * genuinely unhandled promise rejection rather than a visible, logged
   * error. Same failure shape D-134 already fixed for `getByLabel`/
   * `setFocus`/`emitTo`; this was the one call D-134's pass missed.
   */
  it("never lets a rejected listen call escape as an unhandled rejection, and returns a no-op unlisten instead", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    listenMock.mockRejectedValue(new Error("no Tauri runtime"));

    const unlisten = await listenForPreviewReady(vi.fn());

    expect(consoleError).toHaveBeenCalled();
    await expect(unlisten()).resolves.toBeUndefined();
    consoleError.mockRestore();
  });

  /**
   * The whole reason this handshake exists: `new WebviewWindow(...)` creates
   * the window asynchronously, so a push sent immediately after opening it
   * can arrive before the new window's own listener is registered and be
   * silently lost. Announcing readiness only after the listener is live
   * closes that race.
   */
  it("listenForDescriptorPush registers its listener before announcing readiness", async () => {
    const callOrder: string[] = [];
    listenMock.mockImplementation(async () => {
      callOrder.push("listen");
      return vi.fn();
    });
    emitMock.mockImplementation(async () => {
      callOrder.push("emit");
    });

    await listenForDescriptorPush(vi.fn());

    expect(callOrder).toEqual(["listen", "emit"]);
    expect(emitMock).toHaveBeenCalledWith(A3_PREVIEW_READY_EVENT);
  });

  it("listenForDescriptorPush forwards the event payload to the callback", async () => {
    let capturedHandler: ((event: { payload: unknown }) => void) | undefined;
    listenMock.mockImplementation(async (_name: string, handler: (event: { payload: unknown }) => void) => {
      capturedHandler = handler;
      return vi.fn();
    });
    const onDescriptor = vi.fn();

    await listenForDescriptorPush(onDescriptor);
    capturedHandler?.({ payload: { templateId: "t" } });

    expect(onDescriptor).toHaveBeenCalledWith({ templateId: "t" });
  });
});

describe("the block-pin request round trip (Faz 11/L3b, D-170)", () => {
  it("requestBlockPin broadcasts the request with emit (not emitTo) — the preview window doesn't know the main window's label", async () => {
    await requestBlockPin({ stepId: 2, canvasRows: 25 });

    expect(emitMock).toHaveBeenCalledWith(A3_PREVIEW_PIN_REQUEST_EVENT, { stepId: 2, canvasRows: 25 });
    expect(emitToMock).not.toHaveBeenCalled();
  });

  it("requestBlockPin never lets a rejected emit call escape as an unhandled rejection", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    emitMock.mockRejectedValue(new Error("denied"));

    await expect(requestBlockPin({ stepId: 1, canvasRows: 10 })).resolves.toBeUndefined();

    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("listenForBlockPinRequest subscribes to the pin-request event", async () => {
    await listenForBlockPinRequest(vi.fn());

    expect(listenMock).toHaveBeenCalledWith(A3_PREVIEW_PIN_REQUEST_EVENT, expect.any(Function));
  });

  it("listenForBlockPinRequest forwards the event payload to the callback", async () => {
    let capturedHandler: ((event: { payload: unknown }) => void) | undefined;
    listenMock.mockImplementation(async (_name: string, handler: (event: { payload: unknown }) => void) => {
      capturedHandler = handler;
      return vi.fn();
    });
    const onRequest = vi.fn();

    await listenForBlockPinRequest(onRequest);
    capturedHandler?.({ payload: { stepId: 3, canvasRows: 5 } });

    expect(onRequest).toHaveBeenCalledWith({ stepId: 3, canvasRows: 5 });
  });

  it("listenForBlockPinRequest never lets a rejected listen call escape, and returns a no-op unlisten instead", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    listenMock.mockRejectedValue(new Error("no Tauri runtime"));

    const unlisten = await listenForBlockPinRequest(vi.fn());

    expect(consoleError).toHaveBeenCalled();
    await expect(unlisten()).resolves.toBeUndefined();
    consoleError.mockRestore();
  });
});
