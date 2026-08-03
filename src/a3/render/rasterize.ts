import { toPng } from "html-to-image";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import type { ImagePlacement } from "../descriptor";
import type { A3ImageKind, A3ImageSize } from "../methodContract";
import type { PendingImageSlot } from "../layout/place";

/**
 * D-102: the one impure, DOM-dependent step in the chart/diagram pipeline —
 * deliberately kept out of `src/a3`'s pure tree (D-94's carve-out, same
 * class as `HtmlA3Renderer.tsx`). Mounts the method-owned React node
 * off-screen at the slot's own pt→px size (SPEC.md §3.2: "rendered once in
 * the frontend… exported to PNG at 2× or 3× scale"), captures it with
 * `html-to-image` (works uniformly for Recharts' pure-SVG output and React
 * Flow's mixed DOM/SVG output — one capture path, not two), and returns the
 * `ImagePlacement` `buildA3Layout`'s second call embeds. Never called from
 * `src/a3` itself — only from the composition root (`a3Preview.ts`), which
 * owns the async/impure boundary.
 *
 * Three hazards this function exists to defeat, all invisible to jsdom
 * tests (which mock `html-to-image`) and all empirically confirmed by
 * actually running this in a real Chromium — P-21's own "yürütülmemiş yol":
 *
 *   1. `createRoot(host).render(node)` does **not** commit synchronously,
 *      and has still not committed one microtask later — measured, not
 *      assumed. Capturing straight after `render()` therefore snapshots an
 *      empty `<div>`, i.e. every exported chart would be a blank PNG.
 *      `flushSync` forces the commit before anything reads the DOM.
 *   2. Even post-commit, libraries that size themselves from a measured
 *      parent (Recharts' `ResponsiveContainer`, React Flow's `fitView`)
 *      need at least one layout + ResizeObserver cycle before they paint
 *      anything. `settleLayout` yields those frames; the chart components
 *      additionally take **explicit** pixel dimensions (see
 *      `A3ImageSize`) rather than relying on `ResponsiveContainer`, so a
 *      missed measurement degrades to "correct size, maybe unpolished"
 *      instead of "zero-sized, blank".
 *   3. A host positioned far outside the viewport (`top`/`left` several
 *      hundred px or more off-screen) captures as **blank** in a real
 *      browser even after (1) and (2) are fixed — confirmed with a
 *      real-Chromium offset sweep: 0px off-screen captures full content,
 *      -100px is already partially blank, -1000px and beyond are
 *      uniformly white. This is a paint/rasterization-time viewport
 *      culling behavior, not a React timing issue, and is exactly why (1)
 *      and (2) alone were not enough. The host is instead kept at *on-screen*
 *      coordinates (`top: 0; left: 0`) inside a zero-size,
 *      `overflow: hidden` ancestor — invisible to the user, but never
 *      culled, since "on-screen but clipped to nothing" and "off-screen"
 *      are not the same thing to the renderer.
 */
const RASTER_SCALE = 3;
const PT_TO_PX = 96 / 72;
const SETTLE_FRAMES = 2;

/** Partial: not every method registers an image renderer — see `getA3ImageRendererMap`. */
export type A3ImageRendererMap = Readonly<
  Partial<Record<A3ImageKind, (spec: unknown, size: A3ImageSize) => ReactNode>>
>;

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(resolve, 0);
    }
  });
}

/** Yields the layout/ResizeObserver cycles measurement-driven chart libraries need. */
async function settleLayout(): Promise<void> {
  for (let frame = 0; frame < SETTLE_FRAMES; frame += 1) {
    await nextFrame();
  }
}

export async function rasterizePendingImage(
  slot: PendingImageSlot,
  rendererMap: A3ImageRendererMap,
): Promise<ImagePlacement | undefined> {
  const render = rendererMap[slot.kind];
  if (!render) {
    return undefined;
  }

  const widthPx = Math.max(1, Math.round(slot.widthPt * PT_TO_PX));
  const heightPx = Math.max(1, Math.round(slot.heightPt * PT_TO_PX));

  // Hazard 3 (see the file comment): stay on-screen at (0, 0) so nothing
  // culls the paint, but clip it to nothing via a zero-size overflow:hidden
  // ancestor so it is never visible to the user.
  const clipWrapper = document.createElement("div");
  clipWrapper.style.position = "fixed";
  clipWrapper.style.top = "0";
  clipWrapper.style.left = "0";
  clipWrapper.style.width = "0";
  clipWrapper.style.height = "0";
  clipWrapper.style.overflow = "hidden";

  const host = document.createElement("div");
  host.style.width = `${widthPx}px`;
  host.style.height = `${heightPx}px`;
  host.style.backgroundColor = "#FFFFFF";
  clipWrapper.appendChild(host);
  document.body.appendChild(clipWrapper);

  const root = createRoot(host);
  try {
    // Hazard 1 (see the file comment): force the commit before reading the DOM.
    flushSync(() => {
      root.render(render(slot.spec, { widthPx, heightPx }));
    });
    // Hazard 2: let measurement-driven libraries lay themselves out.
    await settleLayout();

    const dataUrl = await toPng(host, {
      width: widthPx,
      height: heightPx,
      pixelRatio: RASTER_SCALE,
      backgroundColor: "#FFFFFF",
    });

    return {
      id: `${slot.entryId}-${slot.kind}`,
      data: dataUrl.replace(/^data:image\/png;base64,/, ""),
      mimeType: "image/png",
      anchorCell: slot.anchorCell,
      widthPt: slot.widthPt,
      heightPt: slot.heightPt,
    };
  } finally {
    root.unmount();
    clipWrapper.remove();
  }
}

/**
 * Rasterizes every slot, **isolating failures per image**: one chart that
 * throws (a bad spec, a font fetch blocked by the Tauri CSP) must not cost
 * the user the entire A3 preview/export, which is what a bare
 * `Promise.all` would do. A failed image is simply absent from the result —
 * its block still renders its text, and the descriptor stays valid.
 */
export async function rasterizePendingImages(
  pendingImages: readonly PendingImageSlot[],
  rendererMap: A3ImageRendererMap,
): Promise<readonly ImagePlacement[]> {
  const settled = await Promise.allSettled(
    pendingImages.map((slot) => rasterizePendingImage(slot, rendererMap)),
  );

  return settled.flatMap((result) =>
    result.status === "fulfilled" && result.value !== undefined ? [result.value] : [],
  );
}
