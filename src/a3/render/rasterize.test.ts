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
    toPngMock.mockImplementationOnce(async () => {
      throw new Error("one bad chart");
    });

    const results = await rasterizePendingImages(
      [slot({ entryId: "bad" }), slot({ entryId: "good" })],
      { "pareto-chart": () => "chart" as never },
    );

    expect(results).toHaveLength(1);
    expect(results[0]!.id).toBe("good-pareto-chart");
  });
});
