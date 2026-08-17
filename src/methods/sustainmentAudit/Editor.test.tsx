import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { SustainmentAuditEditor } from "./Editor";
import type { SustainmentAuditPayload } from "./schema";

function ControlledEditor({
  initial,
  onChange,
}: {
  initial: SustainmentAuditPayload;
  onChange: (payload: SustainmentAuditPayload) => void;
}) {
  const [payload, setPayload] = useState(initial);
  return (
    <SustainmentAuditEditor
      payload={payload}
      onChange={(next) => {
        setPayload(next);
        onChange(next);
      }}
    />
  );
}

describe("SustainmentAuditEditor", () => {
  it("adds a blank audit row wired into the payload's rows field", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SustainmentAuditEditor payload={{ rows: [] }} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Add row" }));

    const lastCall = onChange.mock.calls[0]![0] as SustainmentAuditPayload;
    expect(lastCall.rows).toHaveLength(1);
    expect(lastCall.rows[0]).toMatchObject({
      auditDate: "",
      areaLine: "",
      standardChecked: "",
      sampleSize: "",
      conforming: "",
      nonconforming: "",
      compliancePercent: "",
      auditor: "",
      finding: "",
      reactionActionId: "",
      nextAudit: "",
      status: "",
    });
  });

  it("edits a field on an existing row without touching the others", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const initial: SustainmentAuditPayload = {
      rows: [
        {
          id: "1",
          auditDate: "",
          areaLine: "",
          standardChecked: "",
          sampleSize: "20",
          conforming: "",
          nonconforming: "",
          compliancePercent: "",
          auditor: "",
          finding: "",
          reactionActionId: "",
          nextAudit: "",
          status: "",
        },
      ],
    };
    render(<ControlledEditor initial={initial} onChange={onChange} />);

    await user.type(screen.getByLabelText("Area / line"), "Line 3");

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as SustainmentAuditPayload;
    expect(lastCall.rows[0]).toMatchObject({ areaLine: "Line 3", sampleSize: "20" });
  });
});
