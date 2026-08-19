import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { sustainPlanMethod } from ".";
import { SustainPlanEditor } from "./Editor";
import type { SustainPlanPayload } from "./schema";

const EMPTY = sustainPlanMethod.createEmptyPayload() as SustainPlanPayload;

describe("SustainPlanEditor", () => {
  it("renders all four fields", () => {
    render(<SustainPlanEditor payload={EMPTY} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Audit type")).toBeTruthy();
    expect(screen.getByLabelText("Frequency")).toBeTruthy();
    expect(screen.getByLabelText("Owner")).toBeTruthy();
    expect(screen.getByLabelText("LPA linkage")).toBeTruthy();
  });

  it("writes audit type back into the payload", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SustainPlanEditor payload={EMPTY} onChange={onChange} />);

    await user.type(screen.getByLabelText("Audit type"), "x");

    expect(onChange).toHaveBeenCalledWith({ ...EMPTY, auditType: "x" });
  });
});
