import { render, screen } from "@testing-library/react";
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
  it("renders nothing when no block currently carries a pin", () => {
    const { container } = render(
      <PinnedBlockSummary descriptor={fixtureDescriptor([fixtureBlock()])} onResetBlock={vi.fn()} />,
    );
    expect(container.childElementCount).toBe(0);
  });

  it("lists exactly the pinned blocks, one row each, showing the pinned row count", () => {
    render(
      <PinnedBlockSummary
        descriptor={fixtureDescriptor([
          fixtureBlock({ stepIds: [1], pinnedCanvasRows: 20 }),
          fixtureBlock({ stepIds: [2] }),
          fixtureBlock({ stepIds: [3], pinnedCanvasRows: 4 }),
        ])}
        onResetBlock={vi.fn()}
      />,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Step 1: 20 rows")).toBeDefined();
    expect(screen.getByText("Step 3: 4 rows")).toBeDefined();
  });

  it("clicking a block's reset button calls onResetBlock with that block's own stepId", async () => {
    const user = userEvent.setup();
    const onResetBlock = vi.fn();
    render(
      <PinnedBlockSummary
        descriptor={fixtureDescriptor([fixtureBlock({ stepIds: [4], pinnedCanvasRows: 15 })])}
        onResetBlock={onResetBlock}
      />,
    );

    await user.click(screen.getByRole("button", { name: /reset step 4/i }));

    expect(onResetBlock).toHaveBeenCalledExactlyOnceWith(4);
  });
});
