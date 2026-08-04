import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { WhyWhyTreeEditor } from "./Editor";
import type { WhyWhyTreePayload } from "./schema";

function Controlled({ initial, onChange }: { initial: WhyWhyTreePayload; onChange: (p: WhyWhyTreePayload) => void }) {
  const [payload, setPayload] = useState(initial);
  return (
    <WhyWhyTreeEditor
      payload={payload}
      onChange={(next) => {
        setPayload(next);
        onChange(next);
      }}
    />
  );
}

describe("WhyWhyTreeEditor", () => {
  it("adds a root node with a null parent", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<WhyWhyTreeEditor payload={{ nodes: [] }} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Add branch" }));

    const next = onChange.mock.calls[0]?.[0] as WhyWhyTreePayload;
    expect(next.nodes).toHaveLength(1);
    expect(next.nodes[0]?.parentId).toBeNull();
  });

  /** The branching this method exists for: one why, two answers. */
  it("adds a child under an existing node", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Controlled initial={{ nodes: [{ id: "a", parentId: null, text: "Press stopped" }] }} onChange={onChange} />,
    );

    await user.click(screen.getByRole("button", { name: "Add cause under this" }));

    const next = onChange.mock.calls[0]?.[0] as WhyWhyTreePayload;
    expect(next.nodes[1]?.parentId).toBe("a");
  });

  it("removes a node together with its descendants", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Controlled
        initial={{
          nodes: [
            { id: "a", parentId: null, text: "Press stopped" },
            { id: "b", parentId: "a", text: "Overload trip" },
          ],
        }}
        onChange={onChange}
      />,
    );

    const [removeRoot] = screen.getAllByRole("button", { name: "Remove this branch" });
    await user.click(removeRoot!);

    expect((onChange.mock.calls[0]?.[0] as WhyWhyTreePayload).nodes).toEqual([]);
  });
});
