import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { resultVerdictMethod } from ".";
import { ResultVerdictEditor } from "./Editor";
import type { ResultVerdictPayload } from "./schema";

const EMPTY = resultVerdictMethod.createEmptyPayload() as ResultVerdictPayload;

describe("ResultVerdictEditor", () => {
  it("renders both fields", () => {
    render(<ResultVerdictEditor payload={EMPTY} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Verdict")).toBeTruthy();
    expect(screen.getByLabelText("Notes")).toBeTruthy();
  });

  it("switches verdict via the select control", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ResultVerdictEditor payload={EMPTY} onChange={onChange} />);

    await user.click(screen.getByLabelText("Verdict"));
    await user.click(screen.getByRole("option", { name: "Not met" }));

    const next = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0] as ResultVerdictPayload;
    expect(next.verdict).toBe("notMet");
  });

  it("writes notes back into the payload", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ResultVerdictEditor payload={EMPTY} onChange={onChange} />);

    await user.type(screen.getByLabelText("Notes"), "x");

    expect(onChange).toHaveBeenCalledWith({ ...EMPTY, notes: "x" });
  });
});
