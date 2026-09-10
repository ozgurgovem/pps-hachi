import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import "../../../i18n";
import { createNewProject } from "../../../domain/model";
import { useProjectStore } from "../../../state";
import { AssistantColumn } from "./AssistantColumn";

vi.mock("../../../ai/completionIpc");

const initialStoreState = useProjectStore.getState();

function renderColumn() {
  const { project } = createNewProject({ title: "T", language: "en", appVersion: "0.1.0" });
  useProjectStore.setState({
    ...initialStoreState,
    project: { ...project, meta: { ...project.meta, ai: { ...project.meta.ai, modelId: "openai/gpt-4o" } } },
  });
  return render(
    <MemoryRouter>
      <AssistantColumn stepId={4} />
    </MemoryRouter>,
  );
}

afterEach(() => {
  useProjectStore.setState(initialStoreState, true);
});

describe("AssistantColumn", () => {
  it("renders the chat interface", () => {
    renderColumn();

    expect(screen.getByLabelText("Ask the assistant")).toBeTruthy();
  });

  it("collapses to a thin strip and can be expanded again", async () => {
    const user = userEvent.setup();
    renderColumn();

    await user.click(screen.getByRole("button", { name: "Collapse panel" }));

    expect(screen.queryByLabelText("Ask the assistant")).toBeNull();
    expect(screen.getByRole("button", { name: "Expand panel" })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Expand panel" }));

    expect(screen.getByLabelText("Ask the assistant")).toBeTruthy();
  });
});
