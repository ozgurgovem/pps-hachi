import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { FiveG5N1KEditor } from "./Editor";
import type { FiveG5N1KPayload } from "./schema";

function emptyPayload(): FiveG5N1KPayload {
  return {
    gemba: "",
    gembutsu: "",
    genjitsu: "",
    genri: "",
    gensoku: "",
    ne: "",
    nerede: "",
    nasil: "",
    neZaman: "",
    neKadar: "",
    kim: "",
  };
}

describe("FiveG5N1KEditor", () => {
  it("renders one labeled field per 5G/5N1K dimension", () => {
    render(<FiveG5N1KEditor payload={emptyPayload()} onChange={vi.fn()} />);
    for (const label of [/^Gemba/, /^Gembutsu/, /^Genjitsu/, /^Genri/, /^Gensoku/, /^Who$/]) {
      expect(screen.getByLabelText(label)).toBeTruthy();
    }
  });

  it("updates only the edited field, leaving the others untouched", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FiveG5N1KEditor payload={{ ...emptyPayload(), kim: "Ayşe" }} onChange={onChange} />);

    await user.type(screen.getByLabelText(/^Gemba/), "X");

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as FiveG5N1KPayload;
    expect(lastCall.gemba).toBe("X");
    expect(lastCall.kim).toBe("Ayşe");
  });
});
