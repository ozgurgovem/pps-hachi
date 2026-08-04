import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { HypothesisVerificationEditor } from "./Editor";
import type { HypothesisVerificationPayload } from "./schema";

describe("HypothesisVerificationEditor", () => {
  it("adds a blank candidate-cause row wired into the payload", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<HypothesisVerificationEditor payload={{ rows: [] }} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Add row" }));

    const next = onChange.mock.calls[0]?.[0] as HypothesisVerificationPayload;
    expect(next.rows).toHaveLength(1);
    expect(next.rows[0]).toMatchObject({ candidateCause: "", verificationMethod: "", evidence: "" });
  });

  /** §1.2 S4 needs a machine-readable verdict, so it is a select, not free text. */
  it("offers the verdict as a closed choice", () => {
    render(
      <HypothesisVerificationEditor
        payload={{
          rows: [{ id: "r1", candidateCause: "Die wear", verificationMethod: "", evidence: "", verdict: "confirmed" }],
        }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Verdict")).toBeTruthy();
    expect(screen.getByText("Confirmed")).toBeTruthy();
  });

  it("does not render the reference picker — that is the dialog's job (D-116)", () => {
    render(<HypothesisVerificationEditor payload={{ rows: [] }} onChange={vi.fn()} />);

    expect(screen.queryByText(/Point of cause verified/)).toBeNull();
  });
});
