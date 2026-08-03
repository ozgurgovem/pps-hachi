import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { MsaGageRrEditor } from "./Editor";
import type { MsaGageRrPayload } from "./schema";

function emptyPayload(): MsaGageRrPayload {
  return { method: "", evaluator: "", date: "", percentGrr: "", verdict: "inconclusive", note: "" };
}

function ControlledEditor({
  initial,
  onChange,
}: {
  initial: MsaGageRrPayload;
  onChange: (payload: MsaGageRrPayload) => void;
}) {
  const [payload, setPayload] = useState(initial);
  return (
    <MsaGageRrEditor
      payload={payload}
      onChange={(next) => {
        setPayload(next);
        onChange(next);
      }}
    />
  );
}

describe("MsaGageRrEditor", () => {
  it("renders every labeled field", () => {
    render(<MsaGageRrEditor payload={emptyPayload()} onChange={vi.fn()} />);
    expect(screen.getByLabelText("Method")).toBeTruthy();
    expect(screen.getByLabelText("Evaluator")).toBeTruthy();
    expect(screen.getByLabelText("Date")).toBeTruthy();
    expect(screen.getByLabelText("% GRR")).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "Verdict" })).toBeTruthy();
    expect(screen.getByLabelText("Note")).toBeTruthy();
  });

  it("updates only the edited text field, leaving the others untouched", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MsaGageRrEditor payload={{ ...emptyPayload(), evaluator: "Ayşe" }} onChange={onChange} />);

    await user.type(screen.getByLabelText("Method"), "X");

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as MsaGageRrPayload;
    expect(lastCall.method).toBe("X");
    expect(lastCall.evaluator).toBe("Ayşe");
  });

  it("changes the verdict without touching other fields", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ControlledEditor initial={{ ...emptyPayload(), method: "Gage R&R" }} onChange={onChange} />);

    await user.click(screen.getByRole("combobox", { name: "Verdict" }));
    await user.click(await screen.findByRole("option", { name: "Trustworthy" }));

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as MsaGageRrPayload;
    expect(lastCall.verdict).toBe("trustworthy");
    expect(lastCall.method).toBe("Gage R&R");
  });
});
