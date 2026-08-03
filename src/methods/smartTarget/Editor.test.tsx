import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { SmartTargetEditor } from "./Editor";
import type { SmartTargetPayload } from "./schema";

function ControlledSmartTargetEditor({
  initial,
  onChange,
}: {
  initial: SmartTargetPayload;
  onChange: (payload: SmartTargetPayload) => void;
}) {
  const [payload, setPayload] = useState(initial);
  return (
    <SmartTargetEditor
      payload={payload}
      onChange={(next) => {
        setPayload(next);
        onChange(next);
      }}
    />
  );
}

function emptyPayload(): SmartTargetPayload {
  return {
    metric: "",
    baseline: 0,
    target: 0,
    unit: "",
    dueDate: "",
    owner: "",
    prioritizedItems: [],
    stakeholderNote: "",
  };
}

describe("SmartTargetEditor", () => {
  it("updates the SMART fields independently", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ControlledSmartTargetEditor initial={emptyPayload()} onChange={onChange} />);

    await user.type(screen.getByLabelText("Metric"), "Gürültü");

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as SmartTargetPayload;
    expect(lastCall.metric).toBe("Gürültü");
  });

  it("adds a prioritised item row", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SmartTargetEditor payload={emptyPayload()} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /add item/i }));

    const next = onChange.mock.calls[0]![0] as SmartTargetPayload;
    expect(next.prioritizedItems).toHaveLength(1);
  });

  it("removes a prioritised item row", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const payload: SmartTargetPayload = {
      ...emptyPayload(),
      prioritizedItems: [{ id: "i1", text: "Panel rezonansı" }],
    };
    render(<SmartTargetEditor payload={payload} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /remove item/i }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ prioritizedItems: [] }));
  });
});
