import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../../i18n";
import type { Round } from "../../../domain/model";
import { EntryRoundField } from "./EntryRoundField";

const ROUNDS: readonly Round[] = [
  { id: "r1", openedAt: "2026-08-01T00:00:00.000Z", closedAt: "2026-08-05T00:00:00.000Z", reason: "First pass" },
  { id: "r2", openedAt: "2026-08-10T00:00:00.000Z", reason: "Target not met" },
];

describe("EntryRoundField", () => {
  it("shows the untagged option selected when value is undefined", () => {
    render(<EntryRoundField rounds={ROUNDS} value={undefined} onChange={vi.fn()} />);
    expect(screen.getByText("Not part of a round")).toBeTruthy();
  });

  it("lists every round as an option, labelled by ordinal and reason", async () => {
    const user = userEvent.setup();
    render(<EntryRoundField rounds={ROUNDS} value={undefined} onChange={vi.fn()} />);

    await user.click(screen.getByLabelText("Round"));

    expect(screen.getByRole("option", { name: /Round 1 — First pass/ })).toBeTruthy();
    expect(screen.getByRole("option", { name: /Round 2 — Target not met/ })).toBeTruthy();
  });

  it("emits the round id when a round is picked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<EntryRoundField rounds={ROUNDS} value={undefined} onChange={onChange} />);

    await user.click(screen.getByLabelText("Round"));
    await user.click(screen.getByRole("option", { name: /Round 2/ }));

    expect(onChange).toHaveBeenCalledWith("r2");
  });

  it("emits null when the untagged option is picked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<EntryRoundField rounds={ROUNDS} value="r1" onChange={onChange} />);

    await user.click(screen.getByLabelText("Round"));
    await user.click(screen.getByRole("option", { name: "Not part of a round" }));

    expect(onChange).toHaveBeenCalledWith(null);
  });
});
