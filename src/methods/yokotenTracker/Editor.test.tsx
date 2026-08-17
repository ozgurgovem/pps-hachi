import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { YokotenTrackerEditor } from "./Editor";
import type { YokotenTrackerPayload } from "./schema";

function ControlledEditor({
  initial,
  onChange,
}: {
  initial: YokotenTrackerPayload;
  onChange: (payload: YokotenTrackerPayload) => void;
}) {
  const [payload, setPayload] = useState(initial);
  return (
    <YokotenTrackerEditor
      payload={payload}
      onChange={(next) => {
        setPayload(next);
        onChange(next);
      }}
    />
  );
}

describe("YokotenTrackerEditor", () => {
  it("adds a blank spread-candidate row wired into the payload's rows field", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<YokotenTrackerEditor payload={{ rows: [] }} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Add row" }));

    const lastCall = onChange.mock.calls[0]![0] as YokotenTrackerPayload;
    expect(lastCall.rows).toHaveLength(1);
    expect(lastCall.rows[0]).toMatchObject({
      siteLine: "",
      applicability: "",
      riskReviewed: "",
      actionRequired: "",
      owner: "",
      dueDate: "",
      status: "",
      completionEvidence: "",
      effectivenessChecked: "",
      checkDate: "",
      result: "",
      approval: "",
      notes: "",
    });
  });

  it("edits a field on an existing row without touching the others", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const initial: YokotenTrackerPayload = {
      rows: [
        {
          id: "1",
          siteLine: "",
          applicability: "",
          riskReviewed: "",
          actionRequired: "",
          owner: "M. Yıldız",
          dueDate: "",
          status: "",
          completionEvidence: "",
          effectivenessChecked: "",
          checkDate: "",
          result: "",
          approval: "",
          notes: "",
        },
      ],
    };
    render(<ControlledEditor initial={initial} onChange={onChange} />);

    await user.type(screen.getByLabelText("Site / line / product"), "Bursa Plant");

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as YokotenTrackerPayload;
    expect(lastCall.rows[0]).toMatchObject({ siteLine: "Bursa Plant", owner: "M. Yıldız" });
  });
});
