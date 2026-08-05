import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { TrialResultLogEditor } from "./Editor";
import type { TrialResultLogPayload } from "./schema";

function ControlledEditor({
  initial,
  onChange,
}: {
  initial: TrialResultLogPayload;
  onChange: (payload: TrialResultLogPayload) => void;
}) {
  const [payload, setPayload] = useState(initial);
  return (
    <TrialResultLogEditor
      payload={payload}
      onChange={(next) => {
        setPayload(next);
        onChange(next);
      }}
    />
  );
}

describe("TrialResultLogEditor", () => {
  it("adds a blank result row wired into the payload's rows field", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TrialResultLogEditor payload={{ rows: [] }} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Add row" }));

    const lastCall = onChange.mock.calls[0]![0] as TrialResultLogPayload;
    expect(lastCall.rows).toHaveLength(1);
    expect(lastCall.rows[0]).toMatchObject({ date: "", result: "", note: "" });
  });

  it("edits a field on an existing row without touching the others", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const initial: TrialResultLogPayload = { rows: [{ id: "1", date: "2026-08-10", result: "", note: "" }] };
    render(<ControlledEditor initial={initial} onChange={onChange} />);

    await user.type(screen.getByLabelText("Result"), "Pass");

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as TrialResultLogPayload;
    expect(lastCall.rows[0]).toMatchObject({ date: "2026-08-10", result: "Pass" });
  });
});
