import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { CategoryBreakdownEditor } from "./Editor";
import type { CategoryBreakdownPayload } from "./schema";

describe("CategoryBreakdownEditor", () => {
  it("adds a blank row wired into the payload's rows field", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CategoryBreakdownEditor payload={{ rows: [] }} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Add row" }));

    const next = onChange.mock.calls[0]?.[0] as CategoryBreakdownPayload;
    expect(next.rows).toHaveLength(1);
    expect(next.rows[0]).toMatchObject({ category: "", subProblem: "", effect: "" });
  });

  it("offers the 5M categories as a closed choice, not free text", () => {
    render(
      <CategoryBreakdownEditor
        payload={{ rows: [{ id: "r1", category: "man", subProblem: "", effect: "" }] }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Category")).toBeTruthy();
    expect(screen.getByText("Man")).toBeTruthy();
  });

  it("writes an edited sub-problem back into its row", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CategoryBreakdownEditor
        payload={{ rows: [{ id: "r1", category: "material", subProblem: "", effect: "" }] }}
        onChange={onChange}
      />,
    );

    await user.type(screen.getByLabelText("Sub-problem"), "L");

    const next = onChange.mock.calls[0]?.[0] as CategoryBreakdownPayload;
    expect(next.rows[0]).toMatchObject({ category: "material", subProblem: "L" });
  });
});
