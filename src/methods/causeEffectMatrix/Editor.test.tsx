import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { CauseEffectMatrixEditor } from "./Editor";
import type { CauseEffectMatrixPayload } from "./schema";

function Controlled({
  initial,
  onChange,
}: {
  initial: CauseEffectMatrixPayload;
  onChange: (p: CauseEffectMatrixPayload) => void;
}) {
  const [payload, setPayload] = useState(initial);
  return (
    <CauseEffectMatrixEditor
      payload={payload}
      onChange={(next) => {
        setPayload(next);
        onChange(next);
      }}
    />
  );
}

describe("CauseEffectMatrixEditor", () => {
  it("adds an output and an input", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled initial={{ outputs: [], inputs: [] }} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Add output" }));
    await user.click(screen.getByRole("button", { name: "Add input" }));

    const next = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0] as CauseEffectMatrixPayload;
    expect(next.outputs).toHaveLength(1);
    expect(next.inputs).toHaveLength(1);
  });

  /** The columns are user data, which is exactly what `RowTableEditor` cannot express. */
  it("renders one score field per output, labelled with that output's name", () => {
    render(
      <Controlled
        initial={{
          outputs: [
            { id: "o1", name: "Scrap", weight: "9" },
            { id: "o2", name: "Downtime", weight: "3" },
          ],
          inputs: [{ id: "i1", name: "Melt temp", scores: {} }],
        }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Scrap")).toBeTruthy();
    expect(screen.getByLabelText("Downtime")).toBeTruthy();
  });

  it("shows the live weighted total for an input", () => {
    render(
      <Controlled
        initial={{
          outputs: [{ id: "o1", name: "Scrap", weight: "9" }],
          inputs: [{ id: "i1", name: "Melt temp", scores: { o1: "3" } }],
        }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Total 27")).toBeTruthy();
  });

  it("writes a typed score into the input's scores map under the output's id", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Controlled
        initial={{
          outputs: [{ id: "o1", name: "Scrap", weight: "9" }],
          inputs: [{ id: "i1", name: "Melt temp", scores: {} }],
        }}
        onChange={onChange}
      />,
    );

    await user.type(screen.getByLabelText("Scrap"), "3");

    const next = onChange.mock.calls[0]?.[0] as CauseEffectMatrixPayload;
    expect(next.inputs[0]?.scores).toEqual({ o1: "3" });
  });

  it("labels a score field for an output with no name yet rather than leaving it unlabelled", () => {
    render(
      <Controlled
        initial={{
          outputs: [{ id: "o1", name: "", weight: "" }],
          inputs: [{ id: "i1", name: "x", scores: {} }],
        }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Unnamed output")).toBeTruthy();
  });
});
