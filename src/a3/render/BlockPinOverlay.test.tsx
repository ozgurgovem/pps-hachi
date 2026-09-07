import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "../../i18n";
import type { A3LayoutDescriptor, ElasticBlockGeometry, RowDef } from "../descriptor";
import { BlockPinOverlay } from "./BlockPinOverlay";

/** 15pt rows -> exactly 20px each (15 * 96/72), so drag-pixel math in tests stays a round number. */
function fixtureRows(): RowDef[] {
  const rows: RowDef[] = [];
  for (let index = 4; index <= 31; index += 1) {
    rows.push({ index, heightPt: 15 });
  }
  return rows;
}

function fixtureBlocks(): ElasticBlockGeometry[] {
  return [
    // Already at its own floor (10 canvas rows === minimumCanvasRows 10).
    {
      stepIds: [1],
      contentColumns: { first: "A", last: "B" },
      headerRange: "A4:B5",
      contentRows: { start: 6, end: 15 },
      minimumCanvasRows: 10,
    },
    // 10 canvas rows, floor 5 — real slack to shrink.
    {
      stepIds: [2],
      contentColumns: { first: "A", last: "B" },
      headerRange: "A16:B17",
      contentRows: { start: 18, end: 27 },
      minimumCanvasRows: 5,
    },
    // The column's last block — pinned already, no handle below it.
    {
      stepIds: [3],
      contentColumns: { first: "A", last: "B" },
      headerRange: "A28:B29",
      contentRows: { start: 30, end: 31 },
      minimumCanvasRows: 2,
      pinnedCanvasRows: 2,
    },
  ];
}

function fixtureDescriptor(blocks: ElasticBlockGeometry[] = fixtureBlocks()): A3LayoutDescriptor {
  return {
    templateId: "fixture",
    language: "en",
    styles: [],
    sheets: {
      a3: {
        name: "A3",
        columns: [
          { key: "A", charWidth: 10 },
          { key: "B", charWidth: 10 },
        ],
        rows: fixtureRows(),
        merges: [],
        cells: [],
        images: [],
        pageSetup: {
          paperSize: "A3",
          orientation: "landscape",
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 1,
          marginsIn: { top: 0, bottom: 0, left: 0, right: 0 },
          printArea: "A1:B31",
          zoomPercent: 100,
        },
        freezePanes: false,
        gridlinesVisible: false,
      },
      appendices: [],
    },
    overflowWarnings: [],
    provisionalBlocks: [],
    elasticBlocks: blocks,
  };
}

describe("BlockPinOverlay", () => {
  it("renders nothing in print mode — the pixel math only holds at 1pt = 1px (D-34)", () => {
    const { container } = render(
      <BlockPinOverlay descriptor={fixtureDescriptor()} mode="print" onPinBlock={vi.fn()} />,
    );
    expect(container.childElementCount).toBe(0);
  });

  it("renders nothing when the descriptor has no elastic blocks (e.g. farplas-7step-tr)", () => {
    const { container } = render(
      <BlockPinOverlay descriptor={fixtureDescriptor([])} mode="screen" onPinBlock={vi.fn()} />,
    );
    expect(container.childElementCount).toBe(0);
  });

  it("renders exactly one handle per internal column boundary — 2 for a 3-block column, none below the last block", () => {
    render(<BlockPinOverlay descriptor={fixtureDescriptor()} mode="screen" onPinBlock={vi.fn()} />);
    expect(screen.getAllByRole("separator")).toHaveLength(2);
  });

  it("exposes each handle's current row count and floor via aria-valuenow/aria-valuemin", () => {
    render(<BlockPinOverlay descriptor={fixtureDescriptor()} mode="screen" onPinBlock={vi.fn()} />);
    const handles = screen.getAllByRole("separator");
    expect(handles[0]?.getAttribute("aria-valuenow")).toBe("10");
    expect(handles[0]?.getAttribute("aria-valuemin")).toBe("10");
    expect(handles[1]?.getAttribute("aria-valuenow")).toBe("10");
    expect(handles[1]?.getAttribute("aria-valuemin")).toBe("5");
  });

  it("shows an at-floor hint only on the handle whose block is already at its own minimum", () => {
    render(<BlockPinOverlay descriptor={fixtureDescriptor()} mode="screen" onPinBlock={vi.fn()} />);
    const handles = screen.getAllByRole("separator");
    expect(handles[0]?.getAttribute("title")).not.toBeNull();
    expect(handles[1]?.getAttribute("title")).toBeNull();
  });

  it("dragging a handle down by 2 rows worth of pixels commits a pin grown by 2, on release only", () => {
    const onPinBlock = vi.fn();
    render(<BlockPinOverlay descriptor={fixtureDescriptor()} mode="screen" onPinBlock={onPinBlock} />);
    const handle = screen.getAllByRole("separator")[1]!; // Step 2, 10 rows, floor 5

    fireEvent.pointerDown(handle, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 0, clientY: 40, pointerId: 1 }); // 40px / 20px-per-row = 2 rows
    expect(onPinBlock).not.toHaveBeenCalled(); // no commit while still dragging

    fireEvent.pointerUp(handle, { clientX: 0, clientY: 40, pointerId: 1 });
    expect(onPinBlock).toHaveBeenCalledExactlyOnceWith(2, 12);
  });

  it("does not dispatch a pin when the drag rounds back to the block's own current row count", () => {
    const onPinBlock = vi.fn();
    render(<BlockPinOverlay descriptor={fixtureDescriptor()} mode="screen" onPinBlock={onPinBlock} />);
    const handle = screen.getAllByRole("separator")[1]!;

    fireEvent.pointerDown(handle, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 0, clientY: 5, pointerId: 1 }); // rounds to 0 rows
    fireEvent.pointerUp(handle, { clientX: 0, clientY: 5, pointerId: 1 });

    expect(onPinBlock).not.toHaveBeenCalled();
  });

  it("clamps an upward drag at the block's own floor and still commits the clamped value", () => {
    const onPinBlock = vi.fn();
    render(<BlockPinOverlay descriptor={fixtureDescriptor()} mode="screen" onPinBlock={onPinBlock} />);
    const handle = screen.getAllByRole("separator")[1]!; // Step 2, 10 rows, floor 5

    fireEvent.pointerDown(handle, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 0, clientY: -100_000, pointerId: 1 }); // absurdly far up
    fireEvent.pointerUp(handle, { clientX: 0, clientY: -100_000, pointerId: 1 });

    expect(onPinBlock).toHaveBeenCalledExactlyOnceWith(2, 5); // floor, not below
  });

  it("never lets an already-floored block's handle be dragged below its own floor", () => {
    const onPinBlock = vi.fn();
    render(<BlockPinOverlay descriptor={fixtureDescriptor()} mode="screen" onPinBlock={onPinBlock} />);
    const handle = screen.getAllByRole("separator")[0]!; // Step 1, already at floor 10

    fireEvent.pointerDown(handle, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 0, clientY: -1000, pointerId: 1 });
    fireEvent.pointerUp(handle, { clientX: 0, clientY: -1000, pointerId: 1 });

    expect(onPinBlock).not.toHaveBeenCalled(); // still 10, no real change
  });

  it("ArrowDown grows the block above the handle by exactly one row, committed immediately", () => {
    const onPinBlock = vi.fn();
    render(<BlockPinOverlay descriptor={fixtureDescriptor()} mode="screen" onPinBlock={onPinBlock} />);
    const handle = screen.getAllByRole("separator")[1]!;

    fireEvent.keyDown(handle, { key: "ArrowDown" });

    expect(onPinBlock).toHaveBeenCalledExactlyOnceWith(2, 11);
  });

  it("ArrowUp shrinks by one row, clamped to the floor", () => {
    const onPinBlock = vi.fn();
    render(<BlockPinOverlay descriptor={fixtureDescriptor()} mode="screen" onPinBlock={onPinBlock} />);
    const handle = screen.getAllByRole("separator")[1]!;

    fireEvent.keyDown(handle, { key: "ArrowUp" });

    expect(onPinBlock).toHaveBeenCalledExactlyOnceWith(2, 9);
  });

  it("ArrowUp on an already-floored block dispatches nothing — there is no change to commit", () => {
    const onPinBlock = vi.fn();
    render(<BlockPinOverlay descriptor={fixtureDescriptor()} mode="screen" onPinBlock={onPinBlock} />);
    const handle = screen.getAllByRole("separator")[0]!; // Step 1, already at floor

    fireEvent.keyDown(handle, { key: "ArrowUp" });

    expect(onPinBlock).not.toHaveBeenCalled();
  });

  /**
   * A3PreviewWindow (D-133): its own zoom transform scales the handle's
   * visual position for free (CSS), but `event.clientY` deltas always
   * arrive in raw screen pixels — without dividing by `dragScale` first, a
   * drag at 200% zoom would compute row deltas twice too large.
   */
  it("stops pointer events from bubbling to an ancestor pan handler (A3PreviewWindow wraps this in one)", () => {
    const onPinBlock = vi.fn();
    const ancestorPointerDown = vi.fn();
    const { container } = render(
      <div onPointerDown={ancestorPointerDown}>
        <BlockPinOverlay descriptor={fixtureDescriptor()} mode="screen" onPinBlock={onPinBlock} />
      </div>,
    );
    const handle = container.querySelector('[role="separator"]')!;

    fireEvent.pointerDown(handle, { clientX: 0, clientY: 0, pointerId: 1 });

    expect(ancestorPointerDown).not.toHaveBeenCalled();
  });

  it("dragScale converts raw screen-pixel movement to sheet-pixel movement before rounding to rows", () => {
    const onPinBlock = vi.fn();
    render(
      <BlockPinOverlay descriptor={fixtureDescriptor()} mode="screen" onPinBlock={onPinBlock} dragScale={2} />,
    );
    const handle = screen.getAllByRole("separator")[1]!; // Step 2, 10 rows, floor 5

    fireEvent.pointerDown(handle, { clientX: 0, clientY: 0, pointerId: 1 });
    // 80 screen px / dragScale(2) = 40 sheet px = 2 rows at 20px/row.
    fireEvent.pointerMove(handle, { clientX: 0, clientY: 80, pointerId: 1 });
    fireEvent.pointerUp(handle, { clientX: 0, clientY: 80, pointerId: 1 });

    expect(onPinBlock).toHaveBeenCalledExactlyOnceWith(2, 12);
  });
});
