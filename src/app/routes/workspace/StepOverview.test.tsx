import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../../i18n";
import { createNewProject } from "../../../domain/model";
import type { Entry, ProjectModel } from "../../../domain/model";
import { StepOverview } from "./StepOverview";

const openOrFocusA3PreviewWindow = vi.fn().mockResolvedValue(undefined);

vi.mock("../a3PreviewWindow/window", () => ({
  openOrFocusA3PreviewWindow: (...args: unknown[]) => openOrFocusA3PreviewWindow(...args),
}));

function entry(id: string, methodId: string): Entry {
  return {
    id,
    methodId,
    title: `Entry ${id}`,
    order: 0,
    a3Visibility: "primary",
    payload: {},
    images: [],
    createdAt: "2026-09-06T00:00:00.000Z",
    updatedAt: "2026-09-06T00:00:00.000Z",
    provenance: { origin: "human" },
  };
}

function buildProject(): ProjectModel {
  const { project } = createNewProject({ title: "T", language: "en", appVersion: "0.1.0" });
  return {
    ...project,
    steps: {
      ...project.steps,
      // S1 requires a quantified gap-statement — a bare generic-text entry
      // leaves Step 1 flagged.
      1: { entries: [entry("e1", "generic-text")] },
      // S6 only flags an incomplete action-item; a generic-text entry alone
      // leaves Step 6 complete.
      6: { entries: [entry("e2", "generic-text")] },
    },
  };
}

describe("StepOverview", () => {
  it("renders one card per step with its status, name, purpose, how-to and entry count", () => {
    render(<StepOverview project={buildProject()} onNavigate={() => {}} />);

    const step1Card = screen.getByRole("button", { name: "Step 1: Clarify the Problem" });
    expect(step1Card.textContent).toContain("Step-1");
    expect(step1Card.textContent).toContain(
      "State the gap between the standard and what's actually happening, in a number, a unit and a baseline period — not an opinion.",
    );
    expect(step1Card.textContent).toContain("Start with a gap statement");
    expect(step1Card.textContent).toContain("1 entry");
    // Barış's own call: "flagged" reads as an alarm for a step the user simply
    // hasn't finished yet — the badge text is the same "In progress" as the
    // (structurally unused) `inProgress` status, the underlying `flagged`
    // status/styling is untouched (still the danger-colored badge variant).
    expect(step1Card.textContent).toContain("In progress");

    const step6Card = screen.getByRole("button", { name: "Step 6: Implement" });
    expect(step6Card.textContent).toContain("Complete");

    const step2Card = screen.getByRole("button", { name: "Step 2: Break Down the Problem" });
    expect(step2Card.textContent).toContain("Empty");
    expect(step2Card.textContent).toContain("0 entries");
  });

  it("shows a complete/flagged summary derived from readiness", () => {
    render(<StepOverview project={buildProject()} onNavigate={() => {}} />);

    expect(screen.getByText("1 / 8 complete, 1 in progress")).toBeTruthy();
  });

  it("clicking a card calls onNavigate with that step's id", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<StepOverview project={buildProject()} onNavigate={onNavigate} />);

    await user.click(screen.getByRole("button", { name: "Step 4: Root Cause Analysis" }));

    expect(onNavigate).toHaveBeenCalledWith(4);
  });

  it("the A3 Preview button opens (or focuses) the pop-out preview window", async () => {
    const user = userEvent.setup();
    render(<StepOverview project={buildProject()} onNavigate={() => {}} />);

    await user.click(screen.getByRole("button", { name: "A3 Preview" }));

    expect(openOrFocusA3PreviewWindow).toHaveBeenCalled();
  });
});
