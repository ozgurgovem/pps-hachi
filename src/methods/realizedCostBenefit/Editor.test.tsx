import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { realizedCostBenefitMethod } from ".";
import { RealizedCostBenefitEditor } from "./Editor";
import type { RealizedCostBenefitPayload } from "./schema";

const EMPTY = realizedCostBenefitMethod.createEmptyPayload() as RealizedCostBenefitPayload;

describe("RealizedCostBenefitEditor", () => {
  it("renders all four fields", () => {
    render(<RealizedCostBenefitEditor payload={EMPTY} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Realized benefit")).toBeTruthy();
    expect(screen.getByLabelText("Actual cost")).toBeTruthy();
    expect(screen.getByLabelText("Net benefit")).toBeTruthy();
    expect(screen.getByLabelText("Notes")).toBeTruthy();
  });

  it("writes realized benefit back into the payload", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RealizedCostBenefitEditor payload={EMPTY} onChange={onChange} />);

    await user.type(screen.getByLabelText("Realized benefit"), "x");

    expect(onChange).toHaveBeenCalledWith({ ...EMPTY, realizedBenefit: "x" });
  });
});
