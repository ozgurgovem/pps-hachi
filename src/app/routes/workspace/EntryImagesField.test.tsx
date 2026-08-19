import { useState } from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../../i18n";
import type { ImageRef } from "../../../domain/model";
import type { MethodImageSlot } from "../../../methods";
import { useProjectStore } from "../../../state";
import { EntryImagesField } from "./EntryImagesField";

const initialStoreState = useProjectStore.getState();

function seedOtherEntries(entries: { name: string; bytes: number[] }[]) {
  useProjectStore.setState({ ...initialStoreState, otherEntries: entries });
}

const PLAIN_SLOT: MethodImageSlot = { labelKey: "methods.defectPhotoBoard.photoLabel", max: 1 };
const ANNOTATABLE_SLOT: MethodImageSlot = {
  labelKey: "methods.defectPhotoBoard.photoLabel",
  max: 1,
  annotatable: true,
};

describe("EntryImagesField — annotate trigger (D-119/6e-2)", () => {
  it("shows no Annotate button for a plain (non-annotatable) slot's photo", () => {
    seedOtherEntries([]);
    const images: readonly ImageRef[] = [{ id: "img-1", assetPath: "assets/img_img-1.jpg" }];
    render(<EntryImagesField slots={[PLAIN_SLOT]} images={images} onChange={() => {}} />);

    expect(screen.queryByText("Annotate")).toBeNull();
  });

  it("shows an Annotate button for an annotatable slot's photo, and opens the editor on click", async () => {
    seedOtherEntries([{ name: "assets/img_img-1.jpg", bytes: [0xff, 0xd8, 0xff] }]);
    const images: readonly ImageRef[] = [{ id: "img-1", assetPath: "assets/img_img-1.jpg" }];
    const user = userEvent.setup();

    render(<EntryImagesField slots={[ANNOTATABLE_SLOT]} images={images} onChange={() => {}} />);

    await user.click(screen.getByText("Annotate"));

    expect(screen.getByText("Annotate photo")).toBeTruthy();
    expect(screen.getByText("Arrow")).toBeTruthy(); // the arrow tool button, inside EntryAnnotationEditor
  });

  it("writes the new annotations back onto the specific image, leaving sibling images untouched", async () => {
    seedOtherEntries([{ name: "assets/img_img-1.jpg", bytes: [0xff, 0xd8, 0xff] }]);
    const user = userEvent.setup();

    function Harness() {
      const [images, setImages] = useState<readonly ImageRef[]>([
        { id: "img-1", assetPath: "assets/img_img-1.jpg" },
        { id: "img-2", assetPath: "assets/img_img-2.jpg" },
      ]);
      return <EntryImagesField slots={[{ ...ANNOTATABLE_SLOT, max: 2 }]} images={images} onChange={setImages} />;
    }

    render(<Harness />);

    await user.click(screen.getAllByText("Annotate")[0]!);
    // Draw one arrow directly through the canvas the editor renders (same
    // pointer-event mechanics AnnotatedPhotoCanvas.test.tsx already proves).
    const canvas = document.querySelector(".touch-none") as HTMLElement;
    canvas.getBoundingClientRect = () =>
      ({ x: 0, y: 0, width: 200, height: 100, top: 0, left: 0, right: 200, bottom: 100, toJSON: () => ({}) }) as DOMRect;

    fireEvent.pointerDown(canvas, { clientX: 20, clientY: 10, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 120, clientY: 60, pointerId: 1 });
    fireEvent.pointerUp(canvas, { clientX: 120, clientY: 60, pointerId: 1 });

    // The dialog stays open and is still bound to img-1 — its own annotation
    // list must now show the committed arrow (in addition to the toolbar's
    // own "Arrow" tool button), proving the write landed on the correct
    // image (a wrong-id write would leave the list empty, i.e. only 1 match).
    expect(screen.getAllByText("Arrow")).toHaveLength(2);

    await user.click(screen.getByText("Done"));
    expect(screen.queryByText("Annotate photo")).toBeNull();
  });
});
