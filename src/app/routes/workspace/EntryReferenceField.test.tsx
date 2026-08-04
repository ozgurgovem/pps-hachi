import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../../i18n";
import { createNewProject } from "../../../domain/model/createProject";
import type { Entry, EntryReference, ProjectModel, StepId } from "../../../domain/model";
import type { MethodReferenceRole } from "../../../methods";
import { EntryReferenceField } from "./EntryReferenceField";

/** `Array.prototype.at` is outside this project's compile target's lib. */
function lastArg(mock: { mock: { calls: unknown[][] } }): unknown {
  const calls = mock.mock.calls;
  return calls[calls.length - 1]?.[0];
}

const ROLE: MethodReferenceRole = {
  role: "rootCause",
  labelKey: "methods.countermeasure.references.rootCause.label",
  emptyKey: "methods.countermeasure.references.rootCause.empty",
  fromSteps: [4],
  multiple: true,
};

function entry(id: string, title: string): Entry {
  return {
    id,
    methodId: "generic-text",
    title,
    order: 0,
    a3Visibility: "primary",
    payload: {},
    images: [],
    createdAt: "2026-08-03T00:00:00.000Z",
    updatedAt: "2026-08-03T00:00:00.000Z",
    provenance: { origin: "human" },
  };
}

function projectWith(entriesByStep: Partial<Record<StepId, readonly Entry[]>>): ProjectModel {
  const { project } = createNewProject({ title: "T", language: "en", appVersion: "0.0.0" });
  const steps = { ...project.steps };
  for (const [stepId, entries] of Object.entries(entriesByStep)) {
    const key = Number(stepId) as StepId;
    steps[key] = { ...steps[key], entries: entries.map((e, index) => ({ ...e, order: index })) };
  }
  return { ...project, steps };
}

function Controlled({
  project,
  role = ROLE,
  initial = [],
  onChange,
}: {
  project: ProjectModel;
  role?: MethodReferenceRole;
  initial?: readonly EntryReference[];
  onChange: (next: readonly EntryReference[]) => void;
}) {
  const [references, setReferences] = useState(initial);
  return (
    <EntryReferenceField
      project={project}
      role={role}
      references={references}
      onChange={(next) => {
        setReferences(next);
        onChange(next);
      }}
    />
  );
}

describe("EntryReferenceField", () => {
  it("lists only entries from the role's steps as candidates", () => {
    const project = projectWith({
      4: [entry("rc-1", "Die wear beyond tolerance")],
      2: [entry("poc-1", "Station 30")],
    });

    render(<Controlled project={project} onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: /Die wear beyond tolerance/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Station 30/ })).toBeNull();
  });

  it("emits a reference carrying the declared role when a candidate is picked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const project = projectWith({ 4: [entry("rc-1", "Die wear")] });

    render(<Controlled project={project} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /Die wear/ }));

    expect(onChange).toHaveBeenCalledWith([{ role: "rootCause", targetEntryId: "rc-1" }]);
  });

  it("appends when the role is multiple", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const project = projectWith({ 4: [entry("rc-1", "Die wear"), entry("rc-2", "No poka-yoke")] });

    render(<Controlled project={project} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /Die wear/ }));
    await user.click(screen.getByRole("button", { name: /No poka-yoke/ }));

    expect(lastArg(onChange)).toEqual([
      { role: "rootCause", targetEntryId: "rc-1" },
      { role: "rootCause", targetEntryId: "rc-2" },
    ]);
  });

  it("replaces rather than appends when the role is single-valued", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const project = projectWith({ 4: [entry("rc-1", "Die wear"), entry("rc-2", "No poka-yoke")] });

    render(
      <Controlled
        project={project}
        role={{ ...ROLE, multiple: false }}
        initial={[{ role: "rootCause", targetEntryId: "rc-1" }]}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Unlink/ }));
    await user.click(screen.getByRole("button", { name: /No poka-yoke/ }));

    expect(lastArg(onChange)).toEqual([{ role: "rootCause", targetEntryId: "rc-2" }]);
  });

  /**
   * D-116: one entry can hold several roles, and a *newer build's* role must
   * survive an edit made by this one. The field rewrites its own slice only.
   */
  it("leaves references belonging to other roles untouched", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const project = projectWith({ 4: [entry("rc-1", "Die wear")] });

    render(
      <Controlled
        project={project}
        initial={[{ role: "someFutureRole", targetEntryId: "x-1" }]}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Die wear/ }));

    expect(lastArg(onChange)).toEqual([
      { role: "someFutureRole", targetEntryId: "x-1" },
      { role: "rootCause", targetEntryId: "rc-1" },
    ]);
  });

  /** D-117: a dangling reference is shown honestly, not dropped or repaired. */
  it("shows a reference whose target was deleted as missing, and still allows unlinking it", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const project = projectWith({ 4: [] });

    render(
      <Controlled
        project={project}
        initial={[{ role: "rootCause", targetEntryId: "deleted-1" }]}
        onChange={onChange}
      />,
    );

    expect(screen.getByText(/no longer exists/i)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /Unlink/ }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("does not offer an already-linked entry a second time", async () => {
    const user = userEvent.setup();
    const project = projectWith({ 4: [entry("rc-1", "Die wear")] });

    render(<Controlled project={project} onChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /Die wear/ }));

    const list = screen.getByRole("list");
    expect(within(list).getByText("Die wear")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^Die wear$/ })).toBeNull();
  });

  it("filters candidates by title", async () => {
    const user = userEvent.setup();
    const project = projectWith({ 4: [entry("rc-1", "Die wear"), entry("rc-2", "No poka-yoke")] });

    render(<Controlled project={project} onChange={vi.fn()} />);
    await user.type(screen.getByLabelText("Find an entry"), "poka");

    expect(screen.queryByRole("button", { name: /Die wear/ })).toBeNull();
    expect(screen.getByRole("button", { name: /No poka-yoke/ })).toBeTruthy();
  });

  it("says so when the target step holds nothing to link to yet", () => {
    render(<Controlled project={projectWith({})} onChange={vi.fn()} />);

    expect(screen.getByText(/Nothing to link to yet/)).toBeTruthy();
  });
});
