import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { WeightedDecisionMatrixEditor } from "./Editor";
import type { WeightedDecisionMatrixPayload } from "./schema";

function Controlled({
  initial,
  onChange,
}: {
  initial: WeightedDecisionMatrixPayload;
  onChange: (p: WeightedDecisionMatrixPayload) => void;
}) {
  const [payload, setPayload] = useState(initial);
  return (
    <WeightedDecisionMatrixEditor
      payload={payload}
      onChange={(next) => {
        setPayload(next);
        onChange(next);
      }}
    />
  );
}

describe("WeightedDecisionMatrixEditor", () => {
  it("adds a criterion and an option", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled initial={{ criteria: [], options: [] }} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Add criterion" }));
    await user.click(screen.getByRole("button", { name: "Add option" }));

    const next = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0] as WeightedDecisionMatrixPayload;
    expect(next.criteria).toHaveLength(1);
    expect(next.options).toHaveLength(1);
  });

  it("renders one score field per criterion, labelled with that criterion's name", () => {
    render(
      <Controlled
        initial={{
          criteria: [
            { id: "c1", name: "Cost", weight: "5" },
            { id: "c2", name: "Speed", weight: "2" },
          ],
          options: [{ id: "o1", name: "Option A", scores: {} }],
        }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Cost")).toBeTruthy();
    expect(screen.getByLabelText("Speed")).toBeTruthy();
  });

  it("shows the live weighted total for an option", () => {
    render(
      <Controlled
        initial={{ criteria: [{ id: "c1", name: "Cost", weight: "5" }], options: [{ id: "o1", name: "Option A", scores: { c1: "3" } }] }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Total 15")).toBeTruthy();
  });

  it("writes a typed score into the option's scores map under the criterion's id", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Controlled
        initial={{ criteria: [{ id: "c1", name: "Cost", weight: "5" }], options: [{ id: "o1", name: "Option A", scores: {} }] }}
        onChange={onChange}
      />,
    );

    await user.type(screen.getByLabelText("Cost"), "3");

    const next = onChange.mock.calls[0]?.[0] as WeightedDecisionMatrixPayload;
    expect(next.options[0]?.scores).toEqual({ c1: "3" });
  });
});
