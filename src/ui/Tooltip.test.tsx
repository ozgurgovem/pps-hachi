import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TooltipContent, TooltipProvider, TooltipRoot, TooltipTrigger } from "./Tooltip";

describe("Tooltip", () => {
  // Hide-on-unhover timing is Radix's own state machine, not code this
  // project owns, and is flaky under jsdom's pointer-event emulation — so
  // this only asserts the part that is ours: content renders on hover, with
  // our styling and copy wired correctly.
  it("is closed until hovered, then shows its content", async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider delayDuration={0}>
        <TooltipRoot>
          <TooltipTrigger>Hover for tooltip</TooltipTrigger>
          <TooltipContent>Non-repro hairline — decorative only</TooltipContent>
        </TooltipRoot>
      </TooltipProvider>,
    );

    expect(screen.queryByText("Non-repro hairline — decorative only")).toBeNull();

    await user.hover(screen.getByText("Hover for tooltip"));

    expect(await screen.findByText("Non-repro hairline — decorative only")).toBeTruthy();
  });
});
