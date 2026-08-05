import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { sideEffectRiskAssessmentMethod } from ".";
import { SideEffectRiskAssessmentEditor } from "./Editor";
import type { SideEffectRiskAssessmentPayload } from "./schema";

const EMPTY = sideEffectRiskAssessmentMethod.createEmptyPayload() as SideEffectRiskAssessmentPayload;

describe("SideEffectRiskAssessmentEditor", () => {
  it("renders all three fields", () => {
    render(<SideEffectRiskAssessmentEditor payload={EMPTY} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Side effect / risk")).toBeTruthy();
    expect(screen.getByLabelText("Severity")).toBeTruthy();
    expect(screen.getByLabelText("Mitigation")).toBeTruthy();
  });

  it("writes the description back into the payload", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SideEffectRiskAssessmentEditor payload={EMPTY} onChange={onChange} />);

    await user.type(screen.getByLabelText("Side effect / risk"), "x");

    expect(onChange).toHaveBeenCalledWith({ ...EMPTY, description: "x" });
  });
});
