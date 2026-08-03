import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { ContainmentIcaEditor } from "./Editor";
import type { ContainmentIcaPayload } from "./schema";

function ControlledEditor({
  initial,
  onChange,
}: {
  initial: ContainmentIcaPayload;
  onChange: (payload: ContainmentIcaPayload) => void;
}) {
  const [payload, setPayload] = useState(initial);
  return (
    <ContainmentIcaEditor
      payload={payload}
      onChange={(next) => {
        setPayload(next);
        onChange(next);
      }}
    />
  );
}

describe("ContainmentIcaEditor", () => {
  it("adds a blank containment action row wired into the payload's rows field", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ContainmentIcaEditor payload={{ rows: [] }} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Add row" }));

    const lastCall = onChange.mock.calls[0]![0] as ContainmentIcaPayload;
    expect(lastCall.rows).toHaveLength(1);
    expect(lastCall.rows[0]).toMatchObject({ action: "", owner: "", startDate: "", effectivenessCheck: "", exitCriteria: "" });
  });

  it("edits a field on an existing row without touching the others", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const initial: ContainmentIcaPayload = {
      rows: [{ id: "1", action: "", owner: "Ayşe", startDate: "", effectivenessCheck: "", exitCriteria: "" }],
    };
    render(<ControlledEditor initial={initial} onChange={onChange} />);

    await user.type(screen.getByLabelText("Action"), "100% sort");

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as ContainmentIcaPayload;
    expect(lastCall.rows[0]).toMatchObject({ action: "100% sort", owner: "Ayşe" });
  });
});
