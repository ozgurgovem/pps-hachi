import { createElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { A3ImageSize } from "../methodContract";
import type { PendingImageSlot } from "../layout/place";

type A3ImageRenderer = (spec: unknown, size: A3ImageSize) => ReactNode;

const toPngMock =
  vi.fn<(node: HTMLElement, options?: unknown) => Promise<string>>(
    async () => "data:image/png;base64,AAAA",
  );
vi.mock("html-to-image", () => ({ toPng: toPngMock }));

const { rasterizePendingImage, rasterizePendingImages } = await import("./rasterize");

function slot(overrides: Partial<PendingImageSlot> = {}): PendingImageSlot {
  return {
    entryId: "entry-1",
    kind: "pareto-chart",
    spec: { series: [] },
    anchorCell: "B23",
    widthPt: 100,
    heightPt: 50,
    ...overrides,
  };
}

describe("rasterizePendingImage (D-102)", () => {
  it("returns undefined when no renderer is registered for the slot's kind", async () => {
    const result = await rasterizePendingImage(slot(), {});
    expect(result).toBeUndefined();
    expect(toPngMock).not.toHaveBeenCalled();
  });

  it("mounts the mapped renderer off-screen, rasterizes it, and strips the data-url prefix", async () => {
    const render = vi.fn((): string => "chart");
    const result = await rasterizePendingImage(slot(), { "pareto-chart": render });

    expect(toPngMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      id: "entry-1-pareto-chart",
      data: "AAAA",
      mimeType: "image/png",
      anchorCell: "B23",
      widthPt: 100,
      heightPt: 50,
    });
  });

  it("passes the slot's pt geometry to the renderer as an explicit px box", async () => {
    const render = vi.fn<A3ImageRenderer>(() => "chart");
    await rasterizePendingImage(slot({ widthPt: 72, heightPt: 36 }), { "pareto-chart": render });

    // 72pt -> 96px, 36pt -> 48px at 96/72 DPI.
    expect(render).toHaveBeenCalledWith({ series: [] }, { widthPx: 96, heightPx: 48 });
  });

  it("never asks a renderer to draw into a zero-sized box", async () => {
    const render = vi.fn<A3ImageRenderer>(() => "chart");
    await rasterizePendingImage(slot({ widthPt: 0, heightPt: 0 }), { "pareto-chart": render });

    const size = render.mock.calls[0]![1];
    expect(size.widthPx).toBeGreaterThan(0);
    expect(size.heightPx).toBeGreaterThan(0);
  });

  it("commits the React tree before capturing — a capture of an uncommitted root is blank", async () => {
    // Regression guard for the Phase 5 review finding: `createRoot().render()`
    // is asynchronous, so without an explicit flush the captured host is an
    // empty <div> and every exported chart is a blank PNG.
    let hostHtmlAtCaptureTime = "<unset>";
    toPngMock.mockImplementationOnce(async (node: unknown) => {
      hostHtmlAtCaptureTime = (node as HTMLElement).innerHTML;
      return "data:image/png;base64,AAAA";
    });

    await rasterizePendingImage(slot(), {
      "pareto-chart": () => createElement("p", null, "CHART"),
    });

    expect(hostHtmlAtCaptureTime).toContain("CHART");
  });

  it("does not leave the off-screen host element in the document after rasterizing", async () => {
    const bodyChildrenBefore = document.body.children.length;
    await rasterizePendingImage(slot(), { "pareto-chart": () => "chart" as never });
    expect(document.body.children.length).toBe(bodyChildrenBefore);
  });

  it("cleans up the off-screen host even when the capture throws", async () => {
    const bodyChildrenBefore = document.body.children.length;
    toPngMock.mockImplementationOnce(async () => {
      throw new Error("capture failed");
    });

    await expect(
      rasterizePendingImage(slot(), { "pareto-chart": () => "chart" as never }),
    ).rejects.toThrow("capture failed");
    expect(document.body.children.length).toBe(bodyChildrenBefore);
  });
});

describe("rasterizePendingImages (D-102)", () => {
  it("rasterizes every slot with a registered renderer and skips the rest", async () => {
    const results = await rasterizePendingImages(
      [slot({ entryId: "a", kind: "pareto-chart" }), slot({ entryId: "b", kind: "fishbone-diagram" })],
      { "pareto-chart": () => "chart" as never },
    );

    expect(results).toHaveLength(1);
    expect(results[0]!.id).toBe("a-pareto-chart");
  });

  it("isolates a failing image instead of losing every other chart with it", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    toPngMock.mockImplementationOnce(async () => {
      throw new Error("one bad chart");
    });

    const results = await rasterizePendingImages(
      [slot({ entryId: "bad" }), slot({ entryId: "good" })],
      { "pareto-chart": () => "chart" as never },
    );

    expect(results).toHaveLength(1);
    expect(results[0]!.id).toBe("good-pareto-chart");
    consoleError.mockRestore();
  });

  it("logs a failing image instead of dropping it with zero trace (P-25)", async () => {
    // D-134's own lesson one layer over: a rejection that silently vanishes
    // is a bug in itself. Before this fix, a slot that threw during
    // rasterization left absolutely no signal anywhere — this is what made
    // P-25 (one of two Step 2 chart images missing from the real export)
    // impossible to diagnose from the exported file alone.
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    toPngMock.mockImplementationOnce(async () => {
      throw new Error("one bad chart");
    });

    await rasterizePendingImages([slot({ entryId: "bad", kind: "pareto-chart" })], {
      "pareto-chart": () => "chart" as never,
    });

    expect(consoleError).toHaveBeenCalledTimes(1);
    const [message] = consoleError.mock.calls[0]!;
    expect(String(message)).toContain("bad");
    expect(String(message)).toContain("pareto-chart");
    consoleError.mockRestore();
  });

  it("rasterizes slots one at a time, never starting the next before the previous finishes (P-25)", async () => {
    // The pre-fix implementation ran every pending image's off-screen
    // render + layout-settle + capture concurrently via
    // `Promise.allSettled(pendingImages.map(...))`. That concurrency was
    // never exercised by a real multi-image case in this suite (every
    // existing test above uses a single slot, or a single failing slot),
    // so it survived even though D-105/D-113 already found the real
    // Tauri webview unreliable under a *single* concurrent render. This
    // pins down the fix's actual claim: no two slots are ever in flight
    // at once.
    const events: string[] = [];
    let inFlight = 0;

    toPngMock.mockImplementation(async () => {
      inFlight += 1;
      events.push(`start:${inFlight}`);
      await Promise.resolve();
      events.push(`end:${inFlight}`);
      inFlight -= 1;
      return "data:image/png;base64,AAAA";
    });

    const results = await rasterizePendingImages(
      [slot({ entryId: "a" }), slot({ entryId: "b" })],
      { "pareto-chart": () => "chart" as never },
    );

    expect(results).toHaveLength(2);
    // If both captures were in flight at once, a second "start" would be
    // recorded before the first "end" — the interleaving this asserts
    // against.
    expect(events).toEqual(["start:1", "end:1", "start:1", "end:1"]);
  });
});
