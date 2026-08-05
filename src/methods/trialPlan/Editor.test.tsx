import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { trialPlanMethod } from ".";
import { TrialPlanEditor } from "./Editor";
import type { TrialPlanPayload } from "./schema";

const EMPTY = trialPlanMethod.createEmptyPayload() as TrialPlanPayload;

describe("TrialPlanEditor", () => {
  it("renders all four fields", () => {
    render(<TrialPlanEditor payload={EMPTY} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Scope")).toBeTruthy();
    expect(screen.getByLabelText("Duration")).toBeTruthy();
    expect(screen.getByLabelText("Sample size")).toBeTruthy();
    expect(screen.getByLabelText("Acceptance criteria")).toBeTruthy();
  });

  it("writes duration back into the payload", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TrialPlanEditor payload={EMPTY} onChange={onChange} />);

    await user.type(screen.getByLabelText("Duration"), "x");

    expect(onChange).toHaveBeenCalledWith({ ...EMPTY, duration: "x" });
  });
});
