import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { FiveW2HEditor } from "./Editor";
import type { FiveW2HPayload } from "./schema";

function emptyPayload(): FiveW2HPayload {
  return { what: "", where: "", when: "", who: "", which: "", how: "", howMuch: "" };
}

describe("FiveW2HEditor", () => {
  it("renders one labeled field per 5W2H dimension", () => {
    render(<FiveW2HEditor payload={emptyPayload()} onChange={vi.fn()} />);
    for (const label of [/^What$/, /^Where$/, /^When$/, /^Who$/, /^Which$/, /^How$/, /^How much$/]) {
      expect(screen.getByLabelText(label)).toBeTruthy();
    }
  });

  it("updates only the edited field, leaving the others untouched", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FiveW2HEditor payload={{ ...emptyPayload(), who: "Ayşe" }} onChange={onChange} />);

    await user.type(screen.getByLabelText(/^What$/), "X");

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as FiveW2HPayload;
    expect(lastCall.what).toBe("X");
    expect(lastCall.who).toBe("Ayşe");
  });
});
