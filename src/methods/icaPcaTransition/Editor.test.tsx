import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { icaPcaTransitionMethod } from ".";
import { IcaPcaTransitionEditor } from "./Editor";
import type { IcaPcaTransitionPayload } from "./schema";

const EMPTY = icaPcaTransitionMethod.createEmptyPayload() as IcaPcaTransitionPayload;

describe("IcaPcaTransitionEditor", () => {
  it("asks what has to be true before the interim action comes off", () => {
    render(<IcaPcaTransitionEditor payload={EMPTY} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Exit criteria")).toBeTruthy();
    expect(screen.getByLabelText("Planned removal")).toBeTruthy();
    expect(screen.getByLabelText("Actual removal")).toBeTruthy();
  });

  it("writes the exit criteria back into the payload", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<IcaPcaTransitionEditor payload={EMPTY} onChange={onChange} />);

    await user.type(screen.getByLabelText("Exit criteria"), "3");

    expect(onChange).toHaveBeenCalledWith({ ...EMPTY, exitCriteria: "3" });
  });
});
