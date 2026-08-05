import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { costApprovalMethod } from ".";
import { CostApprovalEditor } from "./Editor";
import type { CostApprovalPayload } from "./schema";

const EMPTY = costApprovalMethod.createEmptyPayload() as CostApprovalPayload;

describe("CostApprovalEditor", () => {
  it("renders all four fields", () => {
    render(<CostApprovalEditor payload={EMPTY} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Cost estimate")).toBeTruthy();
    expect(screen.getByLabelText("Approval status")).toBeTruthy();
    expect(screen.getByLabelText("Approved by")).toBeTruthy();
    expect(screen.getByLabelText("Approval date")).toBeTruthy();
  });

  it("writes cost estimate back into the payload", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CostApprovalEditor payload={EMPTY} onChange={onChange} />);

    await user.type(screen.getByLabelText("Cost estimate"), "x");

    expect(onChange).toHaveBeenCalledWith({ ...EMPTY, costEstimate: "x" });
  });

  it("switches approval status via the select control", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CostApprovalEditor payload={EMPTY} onChange={onChange} />);

    await user.click(screen.getByLabelText("Approval status"));
    await user.click(screen.getByRole("option", { name: "Approved" }));

    const next = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0] as CostApprovalPayload;
    expect(next.approvalStatus).toBe("approved");
  });
});
