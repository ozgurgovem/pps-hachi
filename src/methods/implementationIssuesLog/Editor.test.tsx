import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { ImplementationIssuesLogEditor } from "./Editor";
import type { ImplementationIssuesLogPayload } from "./schema";

function ControlledEditor({
  initial,
  onChange,
}: {
  initial: ImplementationIssuesLogPayload;
  onChange: (payload: ImplementationIssuesLogPayload) => void;
}) {
  const [payload, setPayload] = useState(initial);
  return (
    <ImplementationIssuesLogEditor
      payload={payload}
      onChange={(next) => {
        setPayload(next);
        onChange(next);
      }}
    />
  );
}

describe("ImplementationIssuesLogEditor", () => {
  it("adds a blank issue row wired into the payload's rows field", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ImplementationIssuesLogEditor payload={{ rows: [] }} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Add row" }));

    const lastCall = onChange.mock.calls[0]![0] as ImplementationIssuesLogPayload;
    expect(lastCall.rows).toHaveLength(1);
    expect(lastCall.rows[0]).toMatchObject({ date: "", issue: "", impact: "", resolution: "", status: "" });
  });

  /** §1.3's status field needs a machine-readable value, so it is a select. */
  it("offers status as a closed choice", () => {
    render(
      <ControlledEditor
        initial={{ rows: [{ id: "1", date: "", issue: "Fixture misaligned", impact: "", resolution: "", status: "open" }] }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Status")).toBeTruthy();
  });

  it("edits a field on an existing row without touching the others", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const initial: ImplementationIssuesLogPayload = {
      rows: [{ id: "1", date: "2026-08-10", issue: "", impact: "", resolution: "", status: "" }],
    };
    render(<ControlledEditor initial={initial} onChange={onChange} />);

    await user.type(screen.getByLabelText("Issue"), "Fixture misaligned");

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as ImplementationIssuesLogPayload;
    expect(lastCall.rows[0]).toMatchObject({ date: "2026-08-10", issue: "Fixture misaligned" });
  });
});
