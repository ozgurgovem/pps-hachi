import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { countermeasureMethod } from ".";
import { CountermeasureEditor } from "./Editor";
import type { CountermeasurePayload } from "./schema";

const EMPTY = countermeasureMethod.createEmptyPayload() as CountermeasurePayload;

describe("CountermeasureEditor", () => {
  it("renders the countermeasure's own fields", () => {
    render(<CountermeasureEditor payload={EMPTY} onChange={vi.fn()} />);

    for (const label of [
      "Countermeasure",
      "Expected effect",
      "Owner",
      "Target date",
      "Status",
      "Impact score (1-5, high = high impact)",
      "Cost score (1-5, high = cheap)",
      "Duration score (1-5, high = fast)",
      "Priority decision",
    ]) {
      expect(screen.getByLabelText(label)).toBeTruthy();
    }
  });

  it("shows the live computed priority score once all three scores are filled in", () => {
    const { rerender } = render(<CountermeasureEditor payload={EMPTY} onChange={vi.fn()} />);

    expect(screen.getByText("Priority score: fill in Impact/Cost/Duration to compute")).toBeTruthy();

    const scored: CountermeasurePayload = { ...EMPTY, impactScore: "5", costScore: "4", durationScore: "4" };
    rerender(<CountermeasureEditor payload={scored} onChange={vi.fn()} />);

    expect(screen.getByText("Priority score: 80")).toBeTruthy();
  });

  it("writes the description back into the payload", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CountermeasureEditor payload={EMPTY} onChange={onChange} />);

    await user.type(screen.getByLabelText("Countermeasure"), "P");

    expect(onChange).toHaveBeenCalledWith({ ...EMPTY, description: "P" });
  });

  it("leaves the root-cause links to the dialog's generic picker (D-116)", () => {
    render(<CountermeasureEditor payload={EMPTY} onChange={vi.fn()} />);

    expect(screen.queryByText("Root causes addressed")).toBeNull();
  });
});
