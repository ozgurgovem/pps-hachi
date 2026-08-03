import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { ProblemTypeClassifierEditor } from "./Editor";
import type { ProblemTypeClassifierPayload } from "./schema";

function ControlledEditor({
  initial,
  onChange,
}: {
  initial: ProblemTypeClassifierPayload;
  onChange: (payload: ProblemTypeClassifierPayload) => void;
}) {
  const [payload, setPayload] = useState(initial);
  return (
    <ProblemTypeClassifierEditor
      payload={payload}
      onChange={(next) => {
        setPayload(next);
        onChange(next);
      }}
    />
  );
}

describe("ProblemTypeClassifierEditor", () => {
  it("renders the classification select and a note field", () => {
    render(<ProblemTypeClassifierEditor payload={{ classification: "belowStandard", note: "" }} onChange={vi.fn()} />);
    expect(screen.getByRole("combobox", { name: "Classification" })).toBeTruthy();
    expect(screen.getByLabelText("Note")).toBeTruthy();
  });

  it("changes the classification without touching the note", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ControlledEditor initial={{ classification: "belowStandard", note: "Existing note" }} onChange={onChange} />);

    await user.click(screen.getByLabelText("Classification"));
    await user.click(await screen.findByRole("option", { name: "Inconsistent performance" }));

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as ProblemTypeClassifierPayload;
    expect(lastCall.classification).toBe("inconsistentPerformance");
    expect(lastCall.note).toBe("Existing note");
  });

  it("updates the note without touching the classification", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ProblemTypeClassifierEditor payload={{ classification: "raiseTheStandard", note: "" }} onChange={onChange} />);

    await user.type(screen.getByLabelText("Note"), "X");

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as ProblemTypeClassifierPayload;
    expect(lastCall.note).toBe("X");
    expect(lastCall.classification).toBe("raiseTheStandard");
  });
});
