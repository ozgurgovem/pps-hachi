import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { pointOfCauseMethod } from ".";
import { PointOfCauseEditor } from "./Editor";
import type { PointOfCausePayload } from "./schema";

const EMPTY = pointOfCauseMethod.createEmptyPayload() as PointOfCausePayload;

describe("PointOfCauseEditor", () => {
  it("renders every declared field with its own label", () => {
    render(<PointOfCauseEditor payload={EMPTY} onChange={vi.fn()} />);

    for (const label of ["Process step", "Location", "Occurs when", "Evidence", "Observed on", "Observed by"]) {
      expect(screen.getByLabelText(label)).toBeTruthy();
    }
  });

  it("writes an edited field back into the payload without disturbing the others", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PointOfCauseEditor payload={{ ...EMPTY, location: "Line 3" }} onChange={onChange} />);

    await user.type(screen.getByLabelText("Process step"), "O");

    expect(onChange).toHaveBeenCalledWith({ ...EMPTY, location: "Line 3", processStep: "O" });
  });
});
