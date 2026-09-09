import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "../../i18n";
import type { A3LayoutDescriptor, ElasticBlockGeometry } from "../descriptor";
import { PinnedBlockSummary } from "./PinnedBlockSummary";

function fixtureBlock(overrides: Partial<ElasticBlockGeometry> = {}): ElasticBlockGeometry {
  return {
    stepIds: [2],
    contentColumns: { first: "A", last: "B" },
    headerRange: "A16:B17",
    contentRows: { start: 18, end: 42 },
    minimumCanvasRows: 5,
    ...overrides,
  };
}

function fixtureDescriptor(blocks: readonly ElasticBlockGeometry[]): A3LayoutDescriptor {
  return {
    templateId: "fixture",
    language: "en",
    styles: [],
    sheets: {
      a3: {
        name: "A3",
        columns: [],
        rows: [],
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
          printArea: "A1:A1",
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

describe("PinnedBlockSummary", () => {
  it("renders nothing when there are no elastic blocks", () => {
    const { container } = render(
      <PinnedBlockSummary descriptor={fixtureDescriptor([])} onPinBlock={vi.fn()} />,
    );
    expect(container.childElementCount).toBe(0);
  });

  it("lists exactly the pinned blocks as chips, showing the pinned row count", () => {
    render(
      <PinnedBlockSummary
        descriptor={fixtureDescriptor([
          fixtureBlock({ stepIds: [1], contentColumns: { first: "A", last: "B" }, pinnedCanvasRows: 20 }),
          fixtureBlock({ stepIds: [2], contentColumns: { first: "C", last: "D" } }),
          fixtureBlock({ stepIds: [3], contentColumns: { first: "E", last: "F" }, pinnedCanvasRows: 4 }),
        ])}
        onPinBlock={vi.fn()}
      />,
    );
    expect(screen.getByText("Step 1: 20 rows")).toBeDefined();
    expect(screen.getByText("Step 3: 4 rows")).toBeDefined();
    expect(screen.queryByText(/^Step 2:/)).toBeNull();
  });

  it("clicking a pinned block's reset button calls onPinBlock with that block's stepId and null", async () => {
    const user = userEvent.setup();
    const onPinBlock = vi.fn();
    render(
      <PinnedBlockSummary
        descriptor={fixtureDescriptor([
          fixtureBlock({ stepIds: [4], contentColumns: { first: "A", last: "B" }, pinnedCanvasRows: 15 }),
        ])}
        onPinBlock={onPinBlock}
      />,
    );

    await user.click(screen.getByRole("button", { name: /reset step 4/i }));

    expect(onPinBlock).toHaveBeenCalledExactlyOnceWith(4, null);
  });

  it("renders exactly one manual-entry row per column, for that column's LAST block only", () => {
    render(
      <PinnedBlockSummary
        descriptor={fixtureDescriptor([
          // Column A:B has two blocks (steps 1 then 2) — only step 2, the
          // last one in array order, should get a manual-entry row.
          fixtureBlock({ stepIds: [1], contentColumns: { first: "A", last: "B" } }),
          fixtureBlock({ stepIds: [2], contentColumns: { first: "A", last: "B" } }),
          // Column C:D has a single block (step 3) — it is its own last
          // block, so it gets a row too.
          fixtureBlock({ stepIds: [3], contentColumns: { first: "C", last: "D" } }),
        ])}
        onPinBlock={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Set Step 2's size")).toBeDefined();
    expect(screen.getByLabelText("Set Step 3's size")).toBeDefined();
    expect(screen.queryByLabelText("Set Step 1's size")).toBeNull();
  });

  it("pre-fills the manual input with the block's current row count", () => {
    render(
      <PinnedBlockSummary
        descriptor={fixtureDescriptor([
          fixtureBlock({ stepIds: [5], contentColumns: { first: "A", last: "B" }, contentRows: { start: 10, end: 24 } }),
        ])}
        onPinBlock={vi.fn()}
      />,
    );

    const input = screen.getByLabelText("Set Step 5's size") as HTMLInputElement;
    expect(input.value).toBe("15");
  });

  it("sets the manual input's min attribute to the block's minimumCanvasRows", () => {
    render(
      <PinnedBlockSummary
        descriptor={fixtureDescriptor([
          fixtureBlock({ stepIds: [6], contentColumns: { first: "A", last: "B" }, minimumCanvasRows: 9 }),
        ])}
        onPinBlock={vi.fn()}
      />,
    );

    const input = screen.getByLabelText("Set Step 6's size") as HTMLInputElement;
    expect(input.min).toBe("9");
  });

  it("submitting a manual entry calls onPinBlock with the stepId and the parsed row count", async () => {
    const user = userEvent.setup();
    const onPinBlock = vi.fn();
    render(
      <PinnedBlockSummary
        descriptor={fixtureDescriptor([
          fixtureBlock({
            stepIds: [7],
            contentColumns: { first: "A", last: "B" },
            contentRows: { start: 1, end: 15 },
            minimumCanvasRows: 5,
          }),
        ])}
        onPinBlock={onPinBlock}
      />,
    );

    const input = screen.getByLabelText("Set Step 7's size");
    await user.clear(input);
    await user.type(input, "22");
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(onPinBlock).toHaveBeenCalledExactlyOnceWith(7, 22);
  });

  it("clamps a manual entry below the block's floor up to minimumCanvasRows", async () => {
    const user = userEvent.setup();
    const onPinBlock = vi.fn();
    render(
      <PinnedBlockSummary
        descriptor={fixtureDescriptor([
          fixtureBlock({
            stepIds: [8],
            contentColumns: { first: "A", last: "B" },
            contentRows: { start: 1, end: 15 },
            minimumCanvasRows: 10,
          }),
        ])}
        onPinBlock={onPinBlock}
      />,
    );

    const input = screen.getByLabelText("Set Step 8's size");
    await user.clear(input);
    await user.type(input, "2");
    // Clicking the real Apply button would go through the browser's own
    // implicit-submission constraint validation, which blocks a submit
    // event entirely once the input's own `min` marks it invalid (range
    // underflow) — so it can never reach the component's handler at all.
    // Dispatching the submit event directly exercises the SAME handler the
    // button would (`fireEvent.submit` bypasses only that browser-level
    // gate, not the component's own logic) — the defensive clamp this test
    // targets exists precisely for values that reach the handler despite
    // native validation (a paste, a spin-button quirk, a future relaxed
    // `min`), so this is the real scenario worth covering, not a shortcut
    // around it.
    fireEvent.submit(input.closest("form")!);

    expect(onPinBlock).toHaveBeenCalledExactlyOnceWith(8, 10);
  });

  it("does not call onPinBlock when the submitted value equals the block's current row count", async () => {
    const user = userEvent.setup();
    const onPinBlock = vi.fn();
    render(
      <PinnedBlockSummary
        descriptor={fixtureDescriptor([
          fixtureBlock({
            stepIds: [1],
            contentColumns: { first: "A", last: "B" },
            contentRows: { start: 1, end: 15 },
            minimumCanvasRows: 5,
          }),
        ])}
        onPinBlock={onPinBlock}
      />,
    );

    // Current rows = 15 (1..15 inclusive), submitting the same value unchanged.
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(onPinBlock).not.toHaveBeenCalled();
  });

  it("does not call onPinBlock for blank or non-numeric manual input", async () => {
    const user = userEvent.setup();
    const onPinBlock = vi.fn();
    render(
      <PinnedBlockSummary
        descriptor={fixtureDescriptor([
          fixtureBlock({
            stepIds: [1],
            contentColumns: { first: "A", last: "B" },
            contentRows: { start: 1, end: 15 },
            minimumCanvasRows: 5,
          }),
        ])}
        onPinBlock={onPinBlock}
      />,
    );

    const input = screen.getByLabelText("Set Step 1's size");
    await user.clear(input);
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(onPinBlock).not.toHaveBeenCalled();
  });
});
