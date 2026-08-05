import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { TrainingCommunicationRecordEditor } from "./Editor";
import type { TrainingCommunicationRecordPayload } from "./schema";

function ControlledEditor({
  initial,
  onChange,
}: {
  initial: TrainingCommunicationRecordPayload;
  onChange: (payload: TrainingCommunicationRecordPayload) => void;
}) {
  const [payload, setPayload] = useState(initial);
  return (
    <TrainingCommunicationRecordEditor
      payload={payload}
      onChange={(next) => {
        setPayload(next);
        onChange(next);
      }}
    />
  );
}

describe("TrainingCommunicationRecordEditor", () => {
  it("adds a blank record row wired into the payload's rows field", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TrainingCommunicationRecordEditor payload={{ rows: [] }} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Add row" }));

    const lastCall = onChange.mock.calls[0]![0] as TrainingCommunicationRecordPayload;
    expect(lastCall.rows).toHaveLength(1);
    expect(lastCall.rows[0]).toMatchObject({ date: "", audience: "", method: "", acknowledgedBy: "" });
  });

  it("edits a field on an existing row without touching the others", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const initial: TrainingCommunicationRecordPayload = {
      rows: [{ id: "1", date: "2026-08-10", audience: "", method: "", acknowledgedBy: "" }],
    };
    render(<ControlledEditor initial={initial} onChange={onChange} />);

    await user.type(screen.getByLabelText("Audience"), "Line 3");

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as TrainingCommunicationRecordPayload;
    expect(lastCall.rows[0]).toMatchObject({ date: "2026-08-10", audience: "Line 3" });
  });
});
