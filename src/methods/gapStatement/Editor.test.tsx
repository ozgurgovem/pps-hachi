import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { GapStatementEditor } from "./Editor";
import type { GapStatementPayload } from "./schema";

function emptyPayload(): GapStatementPayload {
  return { ideal: "", actual: "", gap: "" };
}

describe("GapStatementEditor", () => {
  it("renders one labeled field per Ideal/Actual/Gap dimension", () => {
    render(<GapStatementEditor payload={emptyPayload()} onChange={vi.fn()} />);
    for (const label of [/^Ideal/, /^Actual/, /^Gap/]) {
      expect(screen.getByLabelText(label)).toBeTruthy();
    }
  });

  it("updates only the edited field, leaving the others untouched", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<GapStatementEditor payload={{ ...emptyPayload(), actual: "3 leaks" }} onChange={onChange} />);

    await user.type(screen.getByLabelText(/^Ideal/), "X");

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as GapStatementPayload;
    expect(lastCall.ideal).toBe("X");
    expect(lastCall.actual).toBe("3 leaks");
  });
});
