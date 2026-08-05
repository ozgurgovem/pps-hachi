import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { ImpactEffortMatrixEditor } from "./Editor";
import type { ImpactEffortMatrixPayload } from "./schema";

function Controlled({
  initial,
  onChange,
}: {
  initial: ImpactEffortMatrixPayload;
  onChange: (p: ImpactEffortMatrixPayload) => void;
}) {
  const [payload, setPayload] = useState(initial);
  return (
    <ImpactEffortMatrixEditor
      payload={payload}
      onChange={(next) => {
        setPayload(next);
        onChange(next);
      }}
    />
  );
}

describe("ImpactEffortMatrixEditor", () => {
  it("adds an item", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled initial={{ items: [] }} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Add item" }));

    const next = onChange.mock.calls[0]?.[0] as ImpactEffortMatrixPayload;
    expect(next.items).toHaveLength(1);
  });

  it("shows the live computed quadrant for a scored item", () => {
    render(
      <Controlled
        initial={{ items: [{ id: "1", description: "Automate weld check", impact: "5", effort: "1" }] }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Quick win")).toBeTruthy();
  });

  it("shows an unscored indicator until both scores are entered", () => {
    render(
      <Controlled initial={{ items: [{ id: "1", description: "New item", impact: "", effort: "" }] }} onChange={vi.fn()} />,
    );

    expect(screen.getByText("Unscored")).toBeTruthy();
  });

  it("writes a typed impact score", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Controlled initial={{ items: [{ id: "1", description: "x", impact: "", effort: "" }] }} onChange={onChange} />,
    );

    await user.type(screen.getByLabelText("Impact (1–5)"), "4");

    const next = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0] as ImpactEffortMatrixPayload;
    expect(next.items[0]?.impact).toBe("4");
  });
});
