import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { FiveN1KEditor } from "./Editor";
import type { FiveN1KPayload } from "./schema";

function emptyPayload(): FiveN1KPayload {
  return { ne: "", neden: "", nasil: "", kim: "", neZaman: "", nerede: "" };
}

describe("FiveN1KEditor", () => {
  it("renders one labeled field per 5N1K question", () => {
    render(<FiveN1KEditor payload={emptyPayload()} onChange={vi.fn()} />);
    for (const label of [/^What/, /^Why/, /^How$/, /^Who$/, /^When$/, /^Where$/]) {
      expect(screen.getByLabelText(label)).toBeTruthy();
    }
  });

  it("updates only the edited field, leaving the others untouched", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FiveN1KEditor payload={{ ...emptyPayload(), kim: "Ayşe" }} onChange={onChange} />);

    await user.type(screen.getByLabelText(/^What/), "X");

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as FiveN1KPayload;
    expect(lastCall.ne).toBe("X");
    expect(lastCall.kim).toBe("Ayşe");
  });
});
