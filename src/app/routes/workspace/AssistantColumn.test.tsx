import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import "../../../i18n";
import { createNewProject } from "../../../domain/model";
import { useProjectStore } from "../../../state";
import { AssistantColumn } from "./AssistantColumn";
import { getCoachingMarkdown } from "./coachContent";

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
  it("shows an automatic guide card built from this step's real coaching content, without any model call (D-218)", () => {
    renderColumn();

    expect(screen.getByText("Guide for this step")).toBeTruthy();
    const coaching = getCoachingMarkdown("en", 4);
    const firstLine = coaching.split("\n").find((line) => line.trim().length > 0 && !line.startsWith("#"));
    expect(screen.getByText(firstLine!.trim())).toBeTruthy();
  });

  it("renders the chat interface underneath the guide card", () => {
    renderColumn();

    expect(screen.getByLabelText("Ask the assistant")).toBeTruthy();
  });

  it("collapses to a thin strip and can be expanded again", async () => {
    const user = userEvent.setup();
    renderColumn();

    await user.click(screen.getByRole("button", { name: "Collapse panel" }));

    expect(screen.queryByText("Guide for this step")).toBeNull();
    expect(screen.getByRole("button", { name: "Expand panel" })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Expand panel" }));

    expect(screen.getByText("Guide for this step")).toBeTruthy();
  });
});
