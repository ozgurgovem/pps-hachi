import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { statisticalConfirmationMethod } from ".";
import { StatisticalConfirmationEditor } from "./Editor";
import type { StatisticalConfirmationPayload } from "./schema";

const EMPTY = statisticalConfirmationMethod.createEmptyPayload() as StatisticalConfirmationPayload;

describe("StatisticalConfirmationEditor", () => {
  it("renders all four fields", () => {
    render(<StatisticalConfirmationEditor payload={EMPTY} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Cp")).toBeTruthy();
    expect(screen.getByLabelText("Cpk")).toBeTruthy();
    expect(screen.getByLabelText("p-chart summary")).toBeTruthy();
    expect(screen.getByLabelText("Defect rate")).toBeTruthy();
  });

  it("writes cp back into the payload", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StatisticalConfirmationEditor payload={EMPTY} onChange={onChange} />);

    await user.type(screen.getByLabelText("Cp"), "x");

    expect(onChange).toHaveBeenCalledWith({ ...EMPTY, cp: "x" });
  });
});
