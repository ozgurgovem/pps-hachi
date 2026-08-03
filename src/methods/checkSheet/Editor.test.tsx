import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { CheckSheetEditor } from "./Editor";
import type { CheckSheetPayload } from "./schema";

function ControlledEditor({
  initial,
  onChange,
}: {
  initial: CheckSheetPayload;
  onChange: (payload: CheckSheetPayload) => void;
}) {
  const [payload, setPayload] = useState(initial);
  return (
    <CheckSheetEditor
      payload={payload}
      onChange={(next) => {
        setPayload(next);
        onChange(next);
      }}
    />
  );
}

describe("CheckSheetEditor", () => {
  it("adds a blank tally row wired into the payload's rows field", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CheckSheetEditor payload={{ rows: [] }} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Add row" }));

    const lastCall = onChange.mock.calls[0]![0] as CheckSheetPayload;
    expect(lastCall.rows).toHaveLength(1);
    expect(lastCall.rows[0]).toMatchObject({ item: "", count: "", date: "", note: "" });
  });

  it("edits a field on an existing row without touching the others", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const initial: CheckSheetPayload = { rows: [{ id: "1", item: "", count: "12", date: "", note: "" }] };
    render(<ControlledEditor initial={initial} onChange={onChange} />);

    await user.type(screen.getByLabelText("Item"), "Scratch");

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as CheckSheetPayload;
    expect(lastCall.rows[0]).toMatchObject({ item: "Scratch", count: "12" });
  });
});
