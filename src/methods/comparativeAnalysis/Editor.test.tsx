import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { ComparativeAnalysisEditor } from "./Editor";
import type { ComparativeAnalysisPayload } from "./schema";

describe("ComparativeAnalysisEditor", () => {
  it("records what is being compared alongside the rows", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ComparativeAnalysisEditor payload={{ subject: "", rows: [] }} onChange={onChange} />);

    await user.type(screen.getByLabelText("What is being compared"), "C");

    expect(onChange).toHaveBeenCalledWith({ subject: "C", rows: [] });
  });

  it("adds a comparison row with all four columns", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ComparativeAnalysisEditor payload={{ subject: "", rows: [] }} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Add row" }));

    const next = onChange.mock.calls[0]?.[0] as ComparativeAnalysisPayload;
    expect(next.rows[0]).toMatchObject({ characteristic: "", goodCase: "", badCase: "", difference: "" });
  });
});
