import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { A3LayoutDescriptor } from "../../../a3/descriptor";
import { createNewProject } from "../../../domain/model";
import { useProjectStore } from "../../../state";
import { useA3PreviewSync } from "./useA3PreviewSync";

const buildProjectA3Layout = vi.fn();
vi.mock("./a3Preview", () => ({
  buildProjectA3Layout: (...args: unknown[]) => buildProjectA3Layout(...args),
}));
vi.mock("../a3PreviewWindow/window", () => ({
  pushDescriptorToPreviewWindow: vi.fn(() => Promise.resolve()),
  listenForPreviewReady: vi.fn(() => Promise.resolve(vi.fn())),
  listenForBlockPinRequest: vi.fn(() => Promise.resolve(vi.fn())),
}));

const FAKE_DESCRIPTOR = {} as A3LayoutDescriptor;
const initialStoreState = useProjectStore.getState();

function seed() {
  const { project } = createNewProject({ title: "T", language: "en", appVersion: "0.1.0" });
  useProjectStore.setState({ ...initialStoreState, project });
  return project;
}

/**
 * W3 §2.3: a real Chromium measurement (`npx playwright`, D-136's temporary-
 * harness practice) found `buildProjectA3Layout` costs ~50-75ms for any
 * project carrying a chart-bearing entry (anywhere, not just the active
 * step), against ~0.1ms for a chart-free one — and D-84 already writes
 * `project` to the store on every keystroke. These tests pin the debounce
 * that keeps a fast-typing burst from firing N overlapping rebuilds.
 */
describe("useA3PreviewSync debounce (W3)", () => {
  beforeEach(() => {
    buildProjectA3Layout.mockReset();
    buildProjectA3Layout.mockResolvedValue(FAKE_DESCRIPTOR);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    useProjectStore.setState(initialStoreState, true);
  });

  it("builds immediately on first mount — no delay", async () => {
    seed();
    renderHook(() => useA3PreviewSync());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(buildProjectA3Layout).toHaveBeenCalledTimes(1);
  });

  it("coalesces a rapid burst of project changes into exactly one rebuild, fired after the quiet window", async () => {
    const project = seed();
    renderHook(() => useA3PreviewSync());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    buildProjectA3Layout.mockClear();

    // Three "keystrokes" 100ms apart — each well inside the 600ms window,
    // so every earlier pending rebuild must be cancelled, not queued.
    for (let i = 0; i < 3; i += 1) {
      act(() => {
        useProjectStore.setState({ project: { ...project, meta: { ...project.meta, title: `T${i}` } } });
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
    }
    expect(buildProjectA3Layout).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    expect(buildProjectA3Layout).toHaveBeenCalledTimes(1);
  });

  it("still rebuilds once real quiet time passes after the burst ends", async () => {
    const project = seed();
    renderHook(() => useA3PreviewSync());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    buildProjectA3Layout.mockClear();

    act(() => {
      useProjectStore.setState({ project: { ...project, meta: { ...project.meta, title: "Edited" } } });
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(599);
    });
    expect(buildProjectA3Layout).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2);
    });
    expect(buildProjectA3Layout).toHaveBeenCalledTimes(1);
  });
});
