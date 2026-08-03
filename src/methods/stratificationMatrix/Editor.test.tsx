import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { StratificationMatrixEditor } from "./Editor";
import type { StratificationMatrixPayload } from "./schema";

function ControlledEditor({
  initial,
  onChange,
}: {
  initial: StratificationMatrixPayload;
  onChange: (payload: StratificationMatrixPayload) => void;
}) {
  const [payload, setPayload] = useState(initial);
  return (
    <StratificationMatrixEditor
      payload={payload}
      onChange={(next) => {
        setPayload(next);
        onChange(next);
      }}
    />
  );
}

describe("StratificationMatrixEditor", () => {
  it("adds a blank stratum row wired into the payload's rows field", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StratificationMatrixEditor payload={{ rows: [] }} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Add row" }));

    const lastCall = onChange.mock.calls[0]![0] as StratificationMatrixPayload;
    expect(lastCall.rows).toHaveLength(1);
    expect(lastCall.rows[0]).toMatchObject({ line: "", shift: "", count: "" });
  });

  it("edits a field on an existing row without touching the others", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const initial: StratificationMatrixPayload = {
      rows: [
        {
          id: "1",
          line: "",
          shift: "2",
          machine: "",
          cavity: "",
          operator: "",
          supplier: "",
          date: "",
          product: "",
          count: "17",
        },
      ],
    };
    render(<ControlledEditor initial={initial} onChange={onChange} />);

    await user.type(screen.getByLabelText("Line"), "Line 3");

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as StratificationMatrixPayload;
    expect(lastCall.rows[0]).toMatchObject({ line: "Line 3", shift: "2", count: "17" });
  });
});
