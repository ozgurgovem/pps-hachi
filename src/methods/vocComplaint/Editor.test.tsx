import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { VocComplaintEditor } from "./Editor";
import type { VocComplaintPayload } from "./schema";

function ControlledEditor({
  initial,
  onChange,
}: {
  initial: VocComplaintPayload;
  onChange: (payload: VocComplaintPayload) => void;
}) {
  const [payload, setPayload] = useState(initial);
  return (
    <VocComplaintEditor
      payload={payload}
      onChange={(next) => {
        setPayload(next);
        onChange(next);
      }}
    />
  );
}

describe("VocComplaintEditor", () => {
  it("adds a blank complaint row wired into the payload's rows field", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<VocComplaintEditor payload={{ rows: [] }} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Add row" }));

    const lastCall = onChange.mock.calls[0]![0] as VocComplaintPayload;
    expect(lastCall.rows).toHaveLength(1);
    expect(lastCall.rows[0]).toMatchObject({ customer: "", claimNo: "", partNo: "", ppm: "", date: "" });
  });

  it("edits a field on an existing row without touching the others", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const initial: VocComplaintPayload = {
      rows: [{ id: "1", customer: "", claimNo: "C-100", partNo: "32-4471", ppm: "120", date: "" }],
    };
    render(<ControlledEditor initial={initial} onChange={onChange} />);

    await user.type(screen.getByLabelText("Customer"), "Farplas");

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as VocComplaintPayload;
    expect(lastCall.rows[0]).toMatchObject({ customer: "Farplas", claimNo: "C-100" });
  });
});
