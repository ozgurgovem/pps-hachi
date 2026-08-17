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

  /** D-176/P-35: the real form's ✓/❌+KN{N} distinction — shown only on the tree's current leaves (§2.2). */
  describe("outcome selector (§2.2)", () => {
    it("shows an outcome selector on a leaf node", () => {
      render(
        <Controlled initial={{ nodes: [{ id: "a", parentId: null, text: "Press stopped" }] }} onChange={vi.fn()} />,
      );
      expect(screen.getByLabelText("Outcome")).toBeTruthy();
    });

    it("hides the outcome selector once a node gains a child, keeping exactly one selector for the new leaf", async () => {
      const user = userEvent.setup();
      render(
        <Controlled initial={{ nodes: [{ id: "a", parentId: null, text: "Press stopped" }] }} onChange={vi.fn()} />,
      );

      await user.click(screen.getByRole("button", { name: "Add cause under this" }));

      expect(screen.getAllByLabelText("Outcome")).toHaveLength(1);
    });

    it("marking a leaf confirmedRootCause writes it onto the right node without touching its text", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <Controlled initial={{ nodes: [{ id: "a", parentId: null, text: "Press stopped" }] }} onChange={onChange} />,
      );

      await user.click(screen.getByLabelText("Outcome"));
      await user.click(await screen.findByRole("option", { name: "Confirmed root cause" }));

      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as WhyWhyTreePayload;
      expect(lastCall.nodes[0]).toMatchObject({ text: "Press stopped", outcome: "confirmedRootCause" });
    });
  });
});
