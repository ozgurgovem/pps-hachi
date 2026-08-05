import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { ErrorProofingHierarchyEditor } from "./Editor";
import type { ErrorProofingHierarchyPayload } from "./schema";

function Controlled({
  initial,
  onChange,
}: {
  initial: ErrorProofingHierarchyPayload;
  onChange: (p: ErrorProofingHierarchyPayload) => void;
}) {
  const [payload, setPayload] = useState(initial);
  return (
    <ErrorProofingHierarchyEditor
      payload={payload}
      onChange={(next) => {
        setPayload(next);
        onChange(next);
      }}
    />
  );
}

describe("ErrorProofingHierarchyEditor", () => {
  it("renders the level select and note field", () => {
    render(<Controlled initial={{ level: "eliminate", note: "" }} onChange={vi.fn()} />);
    expect(screen.getByLabelText("Error-proofing level")).toBeTruthy();
    expect(screen.getByLabelText("Note")).toBeTruthy();
  });

  it("shows a full strength bar for the strongest level (Eliminate)", () => {
    render(<Controlled initial={{ level: "eliminate", note: "" }} onChange={vi.fn()} />);
    expect(screen.getByRole("img", { name: "Strength 6 of 6" })).toBeTruthy();
  });

  it("shows a mostly-empty strength bar for the weakest level (Procedure/Training)", () => {
    render(<Controlled initial={{ level: "procedure", note: "" }} onChange={vi.fn()} />);
    expect(screen.getByRole("img", { name: "Strength 1 of 6" })).toBeTruthy();
  });

  it("switches level via the select control", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled initial={{ level: "eliminate", note: "" }} onChange={onChange} />);

    await user.click(screen.getByLabelText("Error-proofing level"));
    await user.click(screen.getByRole("option", { name: "Warn" }));

    const next = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0] as ErrorProofingHierarchyPayload;
    expect(next.level).toBe("warn");
  });

  it("writes note text", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled initial={{ level: "eliminate", note: "" }} onChange={onChange} />);

    await user.type(screen.getByLabelText("Note"), "x");

    expect(onChange.mock.calls[0]?.[0]).toMatchObject({ note: "x" });
  });
});
