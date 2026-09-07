import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../../i18n";
import { createNewProject } from "../../../domain/model";
import type { Entry, ProjectModel } from "../../../domain/model";
import { StepQuickJump } from "./StepQuickJump";

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
      1: { entries: [entry("e1", "generic-text") ] }, // flagged (S1)
      6: { entries: [entry("e2", "generic-text") ] }, // complete (S6)
    },
  };
}

describe("StepQuickJump", () => {
  it("renders a back-to-overview control and eight step chips", () => {
    render(
      <StepQuickJump
        project={buildProject()}
        activeStepId={4}
        onNavigate={() => {}}
        onBackToOverview={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: "Back to step overview" })).toBeTruthy();
    for (let step = 1; step <= 8; step += 1) {
      expect(screen.getByText(`Step-${step}`)).toBeTruthy();
    }
  });

  it("clicking the back control calls onBackToOverview", async () => {
    const user = userEvent.setup();
    const onBackToOverview = vi.fn();
    render(
      <StepQuickJump
        project={buildProject()}
        activeStepId={4}
        onNavigate={() => {}}
        onBackToOverview={onBackToOverview}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Back to step overview" }));

    expect(onBackToOverview).toHaveBeenCalledTimes(1);
  });

  it("clicking a step chip calls onNavigate with that step's id", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(
      <StepQuickJump
        project={buildProject()}
        activeStepId={4}
        onNavigate={onNavigate}
        onBackToOverview={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Step 7: Monitor Process and Results" }));

    expect(onNavigate).toHaveBeenCalledWith(7);
  });

  it("marks the active step's chip with aria-current", () => {
    render(
      <StepQuickJump
        project={buildProject()}
        activeStepId={4}
        onNavigate={() => {}}
        onBackToOverview={() => {}}
      />,
    );

    const activeChip = screen.getByRole("button", { name: "Step 4: Root Cause Analysis" });
    expect(activeChip.getAttribute("aria-current")).toBe("step");
    const inactiveChip = screen.getByRole("button", { name: "Step 5: Develop Countermeasures" });
    expect(inactiveChip.getAttribute("aria-current")).toBeNull();
  });

  it("shows D-41's shape glyph per step status — flagged (▲), complete (■), empty (●)", () => {
    render(
      <StepQuickJump
        project={buildProject()}
        activeStepId={4}
        onNavigate={() => {}}
        onBackToOverview={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: "Step 1: Clarify the Problem" }).textContent).toContain("▲");
    expect(screen.getByRole("button", { name: "Step 6: Implement" }).textContent).toContain("■");
    expect(screen.getByRole("button", { name: "Step 2: Break Down the Problem" }).textContent).toContain("●");
  });
});
