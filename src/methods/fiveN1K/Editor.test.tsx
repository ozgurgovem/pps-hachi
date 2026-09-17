import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { FiveN1KEditor } from "./Editor";
import { FIVE_N1K_ANSWER_SOFT_LIMIT } from "./constants";
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

  /** BVVL round, ADIM 1 (2026-09-17): Barış's own instruction — a live, non-blocking character count against the diagram's real soft limit. */
  it("shows a character count for each field, against the diagram's soft limit", () => {
    render(<FiveN1KEditor payload={{ ...emptyPayload(), ne: "Yüksek fire" }} onChange={vi.fn()} />);
    expect(screen.getByText(`11/${FIVE_N1K_ANSWER_SOFT_LIMIT} characters`)).toBeTruthy();
    expect(screen.getAllByText(`0/${FIVE_N1K_ANSWER_SOFT_LIMIT} characters`)).toHaveLength(5);
  });

  it("never blocks typing past the soft limit — the stored value keeps growing", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const longAnswer = "a".repeat(FIVE_N1K_ANSWER_SOFT_LIMIT);
    render(<FiveN1KEditor payload={{ ...emptyPayload(), ne: longAnswer }} onChange={onChange} />);

    await user.type(screen.getByLabelText(/^What/), "b");

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as FiveN1KPayload;
    expect(lastCall.ne).toBe(`${longAnswer}b`);
    expect(lastCall.ne.length).toBeGreaterThan(FIVE_N1K_ANSWER_SOFT_LIMIT);
  });
});
