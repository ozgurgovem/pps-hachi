import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { documentUpdatesTrackerMethod } from ".";
import { DocumentUpdatesTrackerEditor } from "./Editor";
import type { DocumentUpdatesTrackerPayload } from "./schema";

const EMPTY = documentUpdatesTrackerMethod.createEmptyPayload() as DocumentUpdatesTrackerPayload;

function ControlledEditor({
  initial,
  onChange,
}: {
  initial: DocumentUpdatesTrackerPayload;
  onChange: (payload: DocumentUpdatesTrackerPayload) => void;
}) {
  const [payload, setPayload] = useState(initial);
  return (
    <DocumentUpdatesTrackerEditor
      payload={payload}
      onChange={(next) => {
        setPayload(next);
        onChange(next);
      }}
    />
  );
}

describe("DocumentUpdatesTrackerEditor", () => {
  it("renders all seven fixed document-type sections", () => {
    render(<DocumentUpdatesTrackerEditor payload={EMPTY} onChange={vi.fn()} />);

    for (const label of [
      "PFMEA",
      "Control Plan",
      "Work Instruction",
      "Inspection Standard",
      "Training / Competence",
      "Layered Process Audit",
      "APQP / PPAP record",
    ]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it("renders the nine fields for every one of the seven sections", () => {
    render(<DocumentUpdatesTrackerEditor payload={EMPTY} onChange={vi.fn()} />);
    expect(screen.getAllByLabelText("Doc ID")).toHaveLength(7);
    expect(screen.getAllByLabelText("Update required?")).toHaveLength(7);
  });

  it("edits a field in one document type's section without touching the others", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ControlledEditor initial={EMPTY} onChange={onChange} />);

    const controlPlanSection = screen.getByText("Control Plan").closest("div")!;
    await user.type(within(controlPlanSection).getByLabelText("Doc ID"), "x");

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as DocumentUpdatesTrackerPayload;
    expect(lastCall.controlPlan.docId).toBe("x");
    expect(lastCall.pfmea.docId).toBe("");
  });
});
