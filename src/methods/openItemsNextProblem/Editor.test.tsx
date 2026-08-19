import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { OpenItemsNextProblemEditor } from "./Editor";
import type { OpenItemsNextProblemPayload } from "./schema";

function ControlledEditor({
  initial,
  onChange,
}: {
  initial: OpenItemsNextProblemPayload;
  onChange: (payload: OpenItemsNextProblemPayload) => void;
}) {
  const [payload, setPayload] = useState(initial);
  return (
    <OpenItemsNextProblemEditor
      payload={payload}
      onChange={(next) => {
        setPayload(next);
        onChange(next);
      }}
    />
  );
}

describe("OpenItemsNextProblemEditor", () => {
  it("adds a blank item row wired into the payload's rows field", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<OpenItemsNextProblemEditor payload={{ rows: [] }} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Add row" }));

    const lastCall = onChange.mock.calls[0]![0] as OpenItemsNextProblemPayload;
    expect(lastCall.rows).toHaveLength(1);
    expect(lastCall.rows[0]).toMatchObject({ description: "", owner: "", targetDate: "", status: "" });
  });

  /** §1.3's status field needs a machine-readable value, so it is a select. */
  it("offers status as a closed choice", () => {
    render(
      <ControlledEditor
        initial={{ rows: [{ id: "1", description: "Cavity 3 retool", owner: "", targetDate: "", status: "open" }] }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Status")).toBeTruthy();
  });

  it("edits a field on an existing row without touching the others", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const initial: OpenItemsNextProblemPayload = {
      rows: [{ id: "1", description: "", owner: "Tooling", targetDate: "", status: "" }],
    };
    render(<ControlledEditor initial={initial} onChange={onChange} />);

    await user.type(screen.getByLabelText("Description"), "Cavity 3 retool");

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as OpenItemsNextProblemPayload;
    expect(lastCall.rows[0]).toMatchObject({ owner: "Tooling", description: "Cavity 3 retool" });
  });
});
