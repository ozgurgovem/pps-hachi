import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "../../i18n";
import { ImpactEffortCanvas } from "./ImpactEffortCanvas";
import type { ImpactEffortItem } from "./schema";

/** jsdom's default `getBoundingClientRect` returns an all-zero rect — matches `AnnotatedPhotoCanvas.test.tsx`'s own D-119 helper. */
function mockBoundingRect(element: Element, size = 200) {
  element.getBoundingClientRect = () =>
    ({ x: 0, y: 0, width: size, height: size, top: 0, left: 0, right: size, bottom: size, toJSON: () => ({}) }) as DOMRect;
}

function item(overrides: Partial<ImpactEffortItem> = {}): ImpactEffortItem {
  return { id: "1", description: "Automate weld check", impact: "", effort: "", ...overrides };
}

describe("ImpactEffortCanvas", () => {
  it("shows the drag hint and all four quadrant labels", () => {
    render(<ImpactEffortCanvas items={[]} onScoreChange={vi.fn()} />);
    expect(screen.getByText("Drag an item into a quadrant, or type exact scores below.")).toBeTruthy();
    expect(screen.getByText("Quick win")).toBeTruthy();
    expect(screen.getByText("Major project")).toBeTruthy();
    expect(screen.getByText("Fill-in")).toBeTruthy();
    expect(screen.getByText("Thankless task")).toBeTruthy();
  });

  it("writes the representative high-impact/low-effort scores when a dot is dragged into the top-left quadrant", () => {
    const onScoreChange = vi.fn();
    render(<ImpactEffortCanvas items={[item()]} onScoreChange={onScoreChange} />);

    const grid = screen.getByTestId("impact-effort-canvas-grid");
    mockBoundingRect(grid);
    const dot = grid.querySelector('[data-item-id="1"]') as HTMLElement;

    fireEvent.pointerDown(dot, { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(dot, { clientX: 20, clientY: 20, pointerId: 1 });
    fireEvent.pointerUp(dot, { clientX: 20, clientY: 20, pointerId: 1 });

    expect(onScoreChange).toHaveBeenCalledExactlyOnceWith("1", "4", "2");
  });

  it("writes the representative low-impact/high-effort scores when a dot is dragged into the bottom-right quadrant", () => {
    const onScoreChange = vi.fn();
    render(<ImpactEffortCanvas items={[item()]} onScoreChange={onScoreChange} />);

    const grid = screen.getByTestId("impact-effort-canvas-grid");
    mockBoundingRect(grid);
    const dot = grid.querySelector('[data-item-id="1"]') as HTMLElement;

    fireEvent.pointerDown(dot, { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(dot, { clientX: 180, clientY: 180, pointerId: 1 });
    fireEvent.pointerUp(dot, { clientX: 180, clientY: 180, pointerId: 1 });

    expect(onScoreChange).toHaveBeenCalledExactlyOnceWith("1", "2", "4");
  });

  it("does not write a score for a plain click with no real movement — a stray tap must never flatten an existing precise score", () => {
    const onScoreChange = vi.fn();
    render(<ImpactEffortCanvas items={[item({ impact: "5", effort: "1" })]} onScoreChange={onScoreChange} />);

    const grid = screen.getByTestId("impact-effort-canvas-grid");
    mockBoundingRect(grid);
    const dot = grid.querySelector('[data-item-id="1"]') as HTMLElement;

    fireEvent.pointerDown(dot, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerUp(dot, { clientX: 0, clientY: 0, pointerId: 1 });

    expect(onScoreChange).not.toHaveBeenCalled();
  });

  it("positions an already-scored item's dot from its real score, not the drag-drop representative value", () => {
    render(<ImpactEffortCanvas items={[item({ impact: "5", effort: "1" })]} onScoreChange={vi.fn()} />);

    const dot = screen.getByTestId("impact-effort-canvas-grid").querySelector('[data-item-id="1"]') as HTMLElement;
    // impact 5 -> y = 1 - (5-1)/4 = 0 (top edge); effort 1 -> x = (1-1)/4 = 0 (left edge).
    expect(dot.style.left).toBe("0%");
    expect(dot.style.top).toBe("0%");
  });

  it("titles an unscored, unnamed item's dot with the untitled-item fallback and unscored status, hidden from the accessibility tree", () => {
    render(<ImpactEffortCanvas items={[item({ description: "  " })]} onScoreChange={vi.fn()} />);
    const dot = screen.getByTestId("impact-effort-canvas-grid").querySelector('[data-item-id="1"]') as HTMLElement;
    expect(dot.title).toBe("Untitled item — Unscored");
    expect(dot.getAttribute("aria-hidden")).toBe("true");
  });
});
