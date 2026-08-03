import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { IsIsNotEditor } from "./Editor";
import type { IsIsNotPayload } from "./schema";

function emptyPayload(): IsIsNotPayload {
  return {
    whatIs: "",
    whatIsNot: "",
    whereIs: "",
    whereIsNot: "",
    whenIs: "",
    whenIsNot: "",
    extentIs: "",
    extentIsNot: "",
  };
}

describe("IsIsNotEditor", () => {
  it("renders one Is and one Is Not field per dimension", () => {
    render(<IsIsNotEditor payload={emptyPayload()} onChange={vi.fn()} />);
    expect(screen.getByLabelText("What")).toBeTruthy();
    expect(screen.getByLabelText(/What.*Is Not/)).toBeTruthy();
  });

  it("updates only the edited field", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<IsIsNotEditor payload={{ ...emptyPayload(), whereIs: "Hat 3" }} onChange={onChange} />);

    await user.type(screen.getByLabelText("What"), "X");

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as IsIsNotPayload;
    expect(lastCall.whatIs).toBe("X");
    expect(lastCall.whereIs).toBe("Hat 3");
  });
});
