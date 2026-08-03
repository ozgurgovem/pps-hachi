import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { ProcessFlowSipocEditor } from "./Editor";
import type { ProcessFlowSipocPayload } from "./schema";

function ControlledEditor({
  initial,
  onChange,
}: {
  initial: ProcessFlowSipocPayload;
  onChange: (payload: ProcessFlowSipocPayload) => void;
}) {
  const [payload, setPayload] = useState(initial);
  return (
    <ProcessFlowSipocEditor
      payload={payload}
      onChange={(next) => {
        setPayload(next);
        onChange(next);
      }}
    />
  );
}

describe("ProcessFlowSipocEditor", () => {
  it("adds a blank process step row wired into the payload's rows field", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ProcessFlowSipocEditor payload={{ rows: [] }} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Add row" }));

    const lastCall = onChange.mock.calls[0]![0] as ProcessFlowSipocPayload;
    expect(lastCall.rows).toHaveLength(1);
    expect(lastCall.rows[0]).toMatchObject({ step: "", supplier: "", input: "", process: "", output: "", customer: "" });
  });

  it("edits a field on an existing row without touching the others", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const initial: ProcessFlowSipocPayload = {
      rows: [{ id: "1", step: "Weld", supplier: "", input: "", process: "", output: "", customer: "" }],
    };
    render(<ControlledEditor initial={initial} onChange={onChange} />);

    await user.type(screen.getByLabelText("Supplier"), "Press shop");

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as ProcessFlowSipocPayload;
    expect(lastCall.rows[0]).toMatchObject({ step: "Weld", supplier: "Press shop" });
  });
});
