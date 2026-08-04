import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { actionItemMethod } from ".";
import { ActionItemEditor } from "./Editor";
import type { ActionItemPayload } from "./schema";

const EMPTY = actionItemMethod.createEmptyPayload() as ActionItemPayload;

describe("ActionItemEditor", () => {
  it("renders the owner and due date §1.2 S6 flags when missing", () => {
    render(<ActionItemEditor payload={EMPTY} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Owner")).toBeTruthy();
    expect(screen.getByLabelText("Due")).toBeTruthy();
  });

  it("writes the owner back into the payload", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ActionItemEditor payload={EMPTY} onChange={onChange} />);

    await user.type(screen.getByLabelText("Owner"), "A");

    expect(onChange).toHaveBeenCalledWith({ ...EMPTY, owner: "A" });
  });
});
