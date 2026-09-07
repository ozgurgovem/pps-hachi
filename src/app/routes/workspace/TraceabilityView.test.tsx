import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../../i18n";
import { createNewProject } from "../../../domain/model";
import type { Entry, EntryReference, ProjectModel, StepId } from "../../../domain/model";
import { useProjectStore } from "../../../state";
import { TraceabilityView } from "./TraceabilityView";

const initialStoreState = useProjectStore.getState();

function entry(
  id: string,
  methodId: string,
  overrides: Partial<Entry> & { references?: readonly EntryReference[]; payload?: unknown } = {},
): Entry {
  return {
    id,
    methodId,
    title: `Entry ${id}`,
    order: 0,
    a3Visibility: "primary",
    payload: {},
    images: [],
    createdAt: "2026-08-20T00:00:00.000Z",
    updatedAt: "2026-08-20T00:00:00.000Z",
    provenance: { origin: "human" },
    ...overrides,
  };
}

function renderWithProject(entriesByStep: Partial<Record<StepId, readonly Entry[]>>) {
  const { project } = createNewProject({ title: "T", language: "en", appVersion: "0.1.0" });
  let steps = project.steps;
  for (const [stepId, entries] of Object.entries(entriesByStep)) {
    const key = Number(stepId) as StepId;
    steps = { ...steps, [key]: { entries: entries.map((e, index) => ({ ...e, order: index })) } };
  }
  const withEntries: ProjectModel = { ...project, steps };
  useProjectStore.setState({ ...initialStoreState, project: withEntries });
  return render(<TraceabilityView />);
}

describe("TraceabilityView", () => {
  it("renders nothing when no project is open", () => {
    useProjectStore.setState({ ...initialStoreState, project: null });
    const { container } = render(<TraceabilityView />);
    expect(container.firstChild).toBeNull();
  });

  it("shows the empty state and the standard-gap note when no chains exist", () => {
    renderWithProject({});
    expect(screen.getByText(/no traceability chains are recorded yet/i)).toBeTruthy();
    expect(screen.getByText(/aren't linked into this chain yet/i)).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("surfaces a dangling reference as an orphan warning", () => {
    renderWithProject({
      5: [
        entry("c1", "countermeasure", {
          title: "Tighten mold clamp pressure",
          references: [{ role: "rootCause", targetEntryId: "ghost" }],
        }),
      ],
    });
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toMatch(/Tighten mold clamp pressure/);
    expect(alert.textContent).toMatch(/rootCause/);
  });

  it("renders a chain and jumps to the clicked step's node", async () => {
    const user = userEvent.setup();
    renderWithProject({
      2: [entry("poc1", "point-of-cause", { title: "Mold cavity wear" })],
      4: [
        entry("h1", "hypothesis-verification", {
          title: "Cavity wear hypothesis",
          references: [{ role: "pointOfCause", targetEntryId: "poc1" }],
        }),
      ],
    });

    expect(screen.getByText("Step 2: Mold cavity wear")).toBeTruthy();
    expect(screen.getByText("Step 4: Cavity wear hypothesis")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /Cavity wear hypothesis/ }));
    expect(useProjectStore.getState().activeStepId).toBe(4);
  });

  it("shows the flagged badge on a node whose step fails its readiness gate", () => {
    renderWithProject({
      2: [entry("poc1", "point-of-cause")],
      4: [
        entry("h1", "hypothesis-verification", {
          payload: { rows: [] },
          references: [{ role: "pointOfCause", targetEntryId: "poc1" }],
        }),
      ],
    });
    // Step 4's S4 gate rule flags when no hypothesis-verification row is
    // confirmed and no why-why node is a confirmed root cause — true here.
    // The badge's underlying status is still "flagged" (same danger-colored
    // variant); only its display text reads "In progress" now, per Barış's
    // own call that "flagged" read as an alarm for a step simply not done yet.
    const node = screen.getByText("Step 4: Entry h1").closest("button");
    expect(node?.textContent).toMatch(/in progress/i);
  });
});
