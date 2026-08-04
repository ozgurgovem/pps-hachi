import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { FaultTreeEditor } from "./Editor";
import type { FaultTreePayload } from "./schema";

function Controlled({ initial, onChange }: { initial: FaultTreePayload; onChange: (p: FaultTreePayload) => void }) {
  const [payload, setPayload] = useState(initial);
  return (
    <FaultTreeEditor
      payload={payload}
      onChange={(next) => {
        setPayload(next);
        onChange(next);
      }}
    />
  );
}

describe("FaultTreeEditor", () => {
  /**
   * A new node has no children yet, so defaulting it to AND or OR would
   * assert a logic the user never stated — see `gates.ts`.
   */
  it("creates a new node as a basic event, not as a gate", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FaultTreeEditor payload={{ nodes: [] }} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Add branch" }));

    expect((onChange.mock.calls[0]?.[0] as FaultTreePayload).nodes[0]?.gate).toBe("basic");
  });

  it("renders a gate selector per node", () => {
    render(
      <Controlled
        initial={{ nodes: [{ id: "a", parentId: null, text: "Top event", gate: "and" }] }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Gate")).toBeTruthy();
  });

  it("keeps the node's text when only the gate changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Controlled
        initial={{ nodes: [{ id: "a", parentId: null, text: "Top event", gate: "basic" }] }}
        onChange={onChange}
      />,
    );

    await user.type(screen.getByLabelText("Event"), "!");

    const next = onChange.mock.calls[0]?.[0] as FaultTreePayload;
    expect(next.nodes[0]).toMatchObject({ text: "Top event!", gate: "basic" });
  });
});
