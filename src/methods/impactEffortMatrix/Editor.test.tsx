import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { ImpactEffortMatrixEditor } from "./Editor";
import type { ImpactEffortMatrixPayload } from "./schema";

/** Matches `ImpactEffortCanvas.test.tsx`'s own D-119-derived helper — jsdom's default rect is all-zero. */
function mockBoundingRect(element: Element, size = 200) {
  element.getBoundingClientRect = () =>
    ({ x: 0, y: 0, width: size, height: size, top: 0, left: 0, right: size, bottom: size, toJSON: () => ({}) }) as DOMRect;
}

function Controlled({
  initial,
  onChange,
}: {
  initial: ImpactEffortMatrixPayload;
  onChange: (p: ImpactEffortMatrixPayload) => void;
}) {
  const [payload, setPayload] = useState(initial);
  return (
    <ImpactEffortMatrixEditor
      payload={payload}
      onChange={(next) => {
        setPayload(next);
        onChange(next);
      }}
    />
  );
}

describe("ImpactEffortMatrixEditor", () => {
  it("adds an item", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled initial={{ items: [] }} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Add item" }));

    const next = onChange.mock.calls[0]?.[0] as ImpactEffortMatrixPayload;
    expect(next.items).toHaveLength(1);
  });

  it("shows the live computed quadrant for a scored item", () => {
    render(
      <Controlled
        initial={{ items: [{ id: "1", description: "Automate weld check", impact: "5", effort: "1" }] }}
        onChange={vi.fn()}
      />,
    );

    // P-27: scoped to the row's own status span — the canvas above renders the same
    // quadrant strings as corner labels, so a bare `getByText` would be ambiguous.
    expect(screen.getByTestId("item-quadrant-1").textContent).toBe("Quick win");
  });

  it("shows an unscored indicator until both scores are entered", () => {
    render(
      <Controlled initial={{ items: [{ id: "1", description: "New item", impact: "", effort: "" }] }} onChange={vi.fn()} />,
    );

    expect(screen.getByText("Unscored")).toBeTruthy();
  });

  it("writes a typed impact score", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Controlled initial={{ items: [{ id: "1", description: "x", impact: "", effort: "" }] }} onChange={onChange} />,
    );

    await user.type(screen.getByLabelText("Impact (1–5)"), "4");

    const next = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0] as ImpactEffortMatrixPayload;
    expect(next.items[0]?.impact).toBe("4");
  });

  /** P-27: no items means nothing to place on a 2×2 grid — the canvas stays hidden rather than showing an empty square. */
  it("hides the drag canvas when there are no items yet", () => {
    render(<Controlled initial={{ items: [] }} onChange={vi.fn()} />);
    expect(screen.queryByTestId("impact-effort-canvas-grid")).toBeNull();
  });

  /**
   * P-27 §1 question 3 (Barış's own choice): dragging the canvas dot and typing
   * into the numeric inputs both edit the same two fields — proven end to end
   * here through the real `ImpactEffortMatrixEditor`, not just the canvas in
   * isolation (`ImpactEffortCanvas.test.tsx` already covers the drag math alone).
   */
  it("moving the canvas dot updates the same numeric inputs the Editor already renders", () => {
    render(
      <Controlled initial={{ items: [{ id: "1", description: "x", impact: "", effort: "" }] }} onChange={vi.fn()} />,
    );

    const grid = screen.getByTestId("impact-effort-canvas-grid");
    mockBoundingRect(grid);
    const dot = grid.querySelector('[data-item-id="1"]') as HTMLElement;

    fireEvent.pointerDown(dot, { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(dot, { clientX: 20, clientY: 20, pointerId: 1 });
    fireEvent.pointerUp(dot, { clientX: 20, clientY: 20, pointerId: 1 });

    expect((screen.getByLabelText("Impact (1–5)") as HTMLInputElement).value).toBe("4");
    expect((screen.getByLabelText("Effort (1–5)") as HTMLInputElement).value).toBe("2");
  });
});
