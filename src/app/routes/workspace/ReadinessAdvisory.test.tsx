import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "../../../i18n";
import { createNewProject } from "../../../domain/model";
import type { Entry, ProjectModel } from "../../../domain/model";
import { useProjectStore } from "../../../state";
import { ReadinessAdvisory } from "./ReadinessAdvisory";

const initialStoreState = useProjectStore.getState();

function entry(id: string, methodId: string, payload: unknown): Entry {
  return {
    id,
    methodId,
    title: `Entry ${id}`,
    order: 0,
    a3Visibility: "primary",
    payload,
    images: [],
    createdAt: "2026-08-20T00:00:00.000Z",
    updatedAt: "2026-08-20T00:00:00.000Z",
    provenance: { origin: "human" },
  };
}

function renderStep6(entries: readonly Entry[]) {
  const { project } = createNewProject({ title: "T", language: "en", appVersion: "0.1.0" });
  const withEntries: ProjectModel = {
    ...project,
    steps: { ...project.steps, 6: { entries: [...entries] } },
  };
  useProjectStore.setState({ ...initialStoreState, project: withEntries });
}

describe("ReadinessAdvisory", () => {
  it("renders nothing for an empty step", () => {
    renderStep6([]);
    const { container } = render(<ReadinessAdvisory stepId={6} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when the step's entries satisfy the gate rule", () => {
    renderStep6([entry("e1", "action-item", { owner: "Ada", dueDate: "2026-09-01" })]);
    const { container } = render(<ReadinessAdvisory stepId={6} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the gate rule's message when the step is flagged", () => {
    renderStep6([entry("e1", "action-item", { owner: "", dueDate: "2026-09-01" })]);
    render(<ReadinessAdvisory stepId={6} />);
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByText(/no owner or no due date/i)).toBeTruthy();
  });
});
