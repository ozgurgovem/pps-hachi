import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Annotation } from "../../domain/model";
import { AnnotatedPhotoCanvas } from "./AnnotatedPhotoCanvas";

const PHOTO_DATA_URL = "Zm9v"; // "foo" — content doesn't matter, only that it renders as an <img> src.

/** jsdom's default `getBoundingClientRect` returns an all-zero rect; a real 200×100 box lets normalized-coordinate math produce non-degenerate values. */
function mockBoundingRect(element: Element, width = 200, height = 100) {
  element.getBoundingClientRect = () =>
    ({ x: 0, y: 0, width, height, top: 0, left: 0, right: width, bottom: height, toJSON: () => ({}) }) as DOMRect;
}

describe("AnnotatedPhotoCanvas — passive (rasterize) mode", () => {
  it("renders the photo at the explicit pixel box and each annotation's shape, no drawing interaction", () => {
    const annotations: readonly Annotation[] = [
      { id: "a1", shape: "arrow", x0: 0.1, y0: 0.1, x1: 0.6, y1: 0.6 },
      { id: "a2", shape: "circle", x0: 0.2, y0: 0.2, x1: 0.4, y1: 0.4 },
      { id: "a3", shape: "path", points: [{ x: 0.1, y: 0.9 }, { x: 0.5, y: 0.9 }] },
      { id: "a4", shape: "callout", x0: 0.5, y0: 0.1, text: "Burr" },
    ];

    const { container } = render(
      <AnnotatedPhotoCanvas
        photoDataUrl={PHOTO_DATA_URL}
        mimeType="image/jpeg"
        annotations={annotations}
        size={{ widthPx: 300, heightPx: 200 }}
      />,
    );

    const img = container.querySelector("img");
    expect(img?.getAttribute("src")).toBe(`data:image/jpeg;base64,${PHOTO_DATA_URL}`);
    expect(container.querySelectorAll("line")).toHaveLength(3); // arrow = shaft + two head segments
    expect(container.querySelectorAll("ellipse")).toHaveLength(1);
    expect(container.querySelectorAll("polyline")).toHaveLength(1);
    expect(container.textContent).toContain("Burr");
  });
});

describe("AnnotatedPhotoCanvas — interactive (editor) mode", () => {
  it("commits a new arrow on pointer down/move/up when the arrow tool is active", () => {
    const onAnnotationsChange = vi.fn();
    const { container } = render(
      <AnnotatedPhotoCanvas
        photoDataUrl={PHOTO_DATA_URL}
        mimeType="image/jpeg"
        annotations={[]}
        interactive
        tool="arrow"
        onAnnotationsChange={onAnnotationsChange}
      />,
    );

    const wrapper = container.firstElementChild as HTMLElement;
    mockBoundingRect(wrapper);

    fireEvent.pointerDown(wrapper, { clientX: 20, clientY: 10, pointerId: 1 });
    fireEvent.pointerMove(wrapper, { clientX: 120, clientY: 60, pointerId: 1 });
    fireEvent.pointerUp(wrapper, { clientX: 120, clientY: 60, pointerId: 1 });

    expect(onAnnotationsChange).toHaveBeenCalledTimes(1);
    const [committed] = onAnnotationsChange.mock.calls[0]![0] as readonly Annotation[];
    expect(committed).toMatchObject({ shape: "arrow", x0: 0.1, y0: 0.1, x1: 0.6, y1: 0.6 });
    expect(typeof committed!.id).toBe("string");
  });

  it("does not draw when no tool is selected (view/select mode)", () => {
    const onAnnotationsChange = vi.fn();
    const { container } = render(
      <AnnotatedPhotoCanvas
        photoDataUrl={PHOTO_DATA_URL}
        mimeType="image/jpeg"
        annotations={[]}
        interactive
        onAnnotationsChange={onAnnotationsChange}
      />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    mockBoundingRect(wrapper);

    fireEvent.pointerDown(wrapper, { clientX: 20, clientY: 10, pointerId: 1 });
    fireEvent.pointerUp(wrapper, { clientX: 120, clientY: 60, pointerId: 1 });

    expect(onAnnotationsChange).not.toHaveBeenCalled();
  });

  it("places a callout on click, empty text, then the inline input sets it", () => {
    const onAnnotationsChange = vi.fn();
    const { container, rerender } = render(
      <AnnotatedPhotoCanvas
        photoDataUrl={PHOTO_DATA_URL}
        mimeType="image/jpeg"
        annotations={[]}
        interactive
        tool="callout"
        onAnnotationsChange={onAnnotationsChange}
      />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    mockBoundingRect(wrapper);

    fireEvent.pointerDown(wrapper, { clientX: 40, clientY: 20, pointerId: 1 });

    expect(onAnnotationsChange).toHaveBeenCalledTimes(1);
    const placed = onAnnotationsChange.mock.calls[0]![0] as readonly Annotation[];
    expect(placed).toHaveLength(1);
    expect(placed[0]).toMatchObject({ shape: "callout", x0: 0.2, y0: 0.2, text: "" });

    rerender(
      <AnnotatedPhotoCanvas
        photoDataUrl={PHOTO_DATA_URL}
        mimeType="image/jpeg"
        annotations={placed}
        interactive
        tool="callout"
        onAnnotationsChange={onAnnotationsChange}
      />,
    );

    const input = container.querySelector("input");
    expect(input).not.toBeNull();
    fireEvent.change(input!, { target: { value: "Flash" } });
    fireEvent.blur(input!);

    const finalAnnotations = onAnnotationsChange.mock.calls[1]![0] as readonly Annotation[];
    expect(finalAnnotations[0]).toMatchObject({ text: "Flash" });
  });

  it("never renders a label bubble for a callout with blank text outside edit mode", () => {
    const { container } = render(
      <AnnotatedPhotoCanvas
        photoDataUrl={PHOTO_DATA_URL}
        mimeType="image/jpeg"
        annotations={[{ id: "c1", shape: "callout", x0: 0.5, y0: 0.5, text: "" }]}
      />,
    );

    expect(container.querySelector("span.bg-danger\\/90")).toBeNull();
  });

  it("ignores a degenerate (near-zero-length) arrow — no accidental dot annotations", () => {
    const onAnnotationsChange = vi.fn();
    const { container } = render(
      <AnnotatedPhotoCanvas
        photoDataUrl={PHOTO_DATA_URL}
        mimeType="image/jpeg"
        annotations={[]}
        interactive
        tool="arrow"
        onAnnotationsChange={onAnnotationsChange}
      />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    mockBoundingRect(wrapper);

    fireEvent.pointerDown(wrapper, { clientX: 20, clientY: 10, pointerId: 1 });
    fireEvent.pointerUp(wrapper, { clientX: 20, clientY: 10, pointerId: 1 });

    expect(onAnnotationsChange).not.toHaveBeenCalled();
  });
});
