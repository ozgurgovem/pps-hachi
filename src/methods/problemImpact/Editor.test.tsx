import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { problemImpactMethod } from ".";
import { ProblemImpactEditor } from "./Editor";
import type { ProblemImpactPayload } from "./schema";

const EMPTY = problemImpactMethod.createEmptyPayload() as ProblemImpactPayload;

describe("ProblemImpactEditor", () => {
  it("renders the unit field, the loss-form fields, and no categories yet", () => {
    render(<ProblemImpactEditor payload={EMPTY} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Unit")).toBeTruthy();
    expect(screen.getByLabelText("Monthly loss")).toBeTruthy();
    expect(screen.getByLabelText("Yearly loss")).toBeTruthy();
    expect(screen.getByLabelText("Currency/unit")).toBeTruthy();
    expect(screen.getByLabelText("Calculation note")).toBeTruthy();
    expect(screen.queryByLabelText("Category")).toBeNull();
  });

  it("adds a category row on add-category click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ProblemImpactEditor payload={EMPTY} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Add category" }));

    const next = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0] as ProblemImpactPayload;
    expect(next.categories).toHaveLength(1);
  });

  it("writes the monthly loss field back into the payload without touching categories", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const payload: ProblemImpactPayload = { ...EMPTY, categories: [{ id: "c1", label: "X", count: 3 }] };
    render(<ProblemImpactEditor payload={payload} onChange={onChange} />);

    await user.type(screen.getByLabelText("Monthly loss"), "x");

    expect(onChange).toHaveBeenCalledWith({ ...payload, monthlyLoss: "x" });
  });
});
