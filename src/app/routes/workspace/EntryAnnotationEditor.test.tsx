import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../../i18n";
import type { Annotation, ImageRef } from "../../../domain/model";
import { useProjectStore } from "../../../state";
import { EntryAnnotationEditor } from "./EntryAnnotationEditor";

const initialStoreState = useProjectStore.getState();

function seedOtherEntries(entries: { name: string; bytes: number[] }[]) {
  useProjectStore.setState({ ...initialStoreState, otherEntries: entries });
}

describe("EntryAnnotationEditor", () => {
  it("renders nothing when the photo's bytes are not loaded in otherEntries", () => {
    seedOtherEntries([]);
    const image: ImageRef = { id: "img-1", assetPath: "assets/img_img-1.jpg" };

    const { container } = render(<EntryAnnotationEditor image={image} onAnnotationsChange={() => {}} />);

    expect(container.textContent).toBe("");
  });

  it("shows the empty-state hint and all four tool buttons when the image has no annotations yet", () => {
    seedOtherEntries([{ name: "assets/img_img-1.jpg", bytes: [1, 2, 3] }]);
    const image: ImageRef = { id: "img-1", assetPath: "assets/img_img-1.jpg" };

    render(<EntryAnnotationEditor image={image} onAnnotationsChange={() => {}} />);

    expect(screen.getByText("No markup yet — pick a tool above, then draw on the photo.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Arrow" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Circle" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Callout" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Draw" })).toBeTruthy();
  });

  it("defaults to the arrow tool active, and switches on click", async () => {
    seedOtherEntries([{ name: "assets/img_img-1.jpg", bytes: [1, 2, 3] }]);
    const image: ImageRef = { id: "img-1", assetPath: "assets/img_img-1.jpg" };
    const user = userEvent.setup();

    render(<EntryAnnotationEditor image={image} onAnnotationsChange={() => {}} />);

    expect(screen.getByRole("button", { name: "Arrow" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Circle" }).getAttribute("aria-pressed")).toBe("false");

    await user.click(screen.getByRole("button", { name: "Circle" }));

    expect(screen.getByRole("button", { name: "Circle" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Arrow" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("lists existing annotations with a shape label and a remove button", () => {
    seedOtherEntries([{ name: "assets/img_img-1.jpg", bytes: [1, 2, 3] }]);
    const annotations: Annotation[] = [
      { id: "a1", shape: "circle", x0: 0.1, y0: 0.1, x1: 0.3, y1: 0.3 },
      { id: "a2", shape: "callout", x0: 0.5, y0: 0.5, text: "Flash" },
    ];
    const image: ImageRef = { id: "img-1", assetPath: "assets/img_img-1.jpg", annotations };

    render(<EntryAnnotationEditor image={image} onAnnotationsChange={() => {}} />);

    // "Circle" also appears as the toolbar's own tool button label.
    expect(screen.getAllByText("Circle")).toHaveLength(2);
    expect(screen.getByText("Callout: Flash")).toBeTruthy();
  });

  it("removing an annotation from the list calls onAnnotationsChange with it excluded", async () => {
    seedOtherEntries([{ name: "assets/img_img-1.jpg", bytes: [1, 2, 3] }]);
    const annotations: Annotation[] = [
      { id: "a1", shape: "circle", x0: 0.1, y0: 0.1, x1: 0.3, y1: 0.3 },
      { id: "a2", shape: "path", points: [{ x: 0.1, y: 0.1 }, { x: 0.2, y: 0.2 }] },
    ];
    const image: ImageRef = { id: "img-1", assetPath: "assets/img_img-1.jpg", annotations };
    const onAnnotationsChange = vi.fn();
    const user = userEvent.setup();

    render(<EntryAnnotationEditor image={image} onAnnotationsChange={onAnnotationsChange} />);

    await user.click(screen.getByRole("button", { name: "Remove Circle" }));

    expect(onAnnotationsChange).toHaveBeenCalledWith([annotations[1]]);
  });
});
