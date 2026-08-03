import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { FishboneEditor } from "./Editor";
import type { FishbonePayload } from "./schema";

function ControlledFishboneEditor({
  initial,
  onChange,
}: {
  initial: FishbonePayload;
  onChange: (payload: FishbonePayload) => void;
}) {
  const [payload, setPayload] = useState(initial);
  return (
    <FishboneEditor
      payload={payload}
      onChange={(next) => {
        setPayload(next);
        onChange(next);
      }}
    />
  );
}

describe("FishboneEditor", () => {
  it("adds a top-level cause under the selected category", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const payload: FishbonePayload = { categorySet: "4M", causes: [] };

    render(<ControlledFishboneEditor initial={payload} onChange={onChange} />);
    await user.type(screen.getByLabelText("Cause"), "Aşınmış kalıp");
    await user.click(screen.getByRole("button", { name: "Add cause" }));

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as FishbonePayload;
    expect(lastCall.causes).toHaveLength(1);
    expect(lastCall.causes[0]).toMatchObject({ categoryId: "man", text: "Aşınmış kalıp" });
  });

  it("removes a cause from the list", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const payload: FishbonePayload = {
      categorySet: "4M",
      causes: [{ id: "c1", categoryId: "machine", text: "Aşınmış kalıp" }],
    };

    render(<ControlledFishboneEditor initial={payload} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Remove cause" }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ causes: [] }));
  });

  it("switching category set drops causes that no longer belong to a valid category", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const payload: FishbonePayload = {
      categorySet: "4M",
      causes: [{ id: "c1", categoryId: "man", text: "Yorgunluk" }],
    };

    render(<ControlledFishboneEditor initial={payload} onChange={onChange} />);
    await user.click(screen.getByLabelText("Category set"));
    await user.click(await screen.findByRole("option", { name: "8P" }));

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as FishbonePayload;
    expect(lastCall.categorySet).toBe("8P");
    // "man" isn't a valid category in the 8P set — the cause is dropped, not silently orphaned.
    expect(lastCall.causes).toEqual([]);
  });

  it("renders one card per category set option", async () => {
    render(<ControlledFishboneEditor initial={{ categorySet: "4M", causes: [] }} onChange={vi.fn()} />);
    const combobox = screen.getByRole("combobox", { name: "Category set" });
    expect(within(combobox).getByText("4M")).toBeTruthy();
  });
});
