import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import "../../../i18n";
import { createNewProject } from "../../../domain/model";
import type { AiMeta, ProjectModel } from "../../../domain/model";
import { useProjectStore } from "../../../state";
import { MockAuditPanel } from "./MockAuditPanel";
import * as mockAudit from "./mockAudit";

vi.mock("./mockAudit", async () => {
  const actual = await vi.importActual<typeof import("./mockAudit")>("./mockAudit");
  return { ...actual, buildMockAuditContext: vi.fn(), proposeMockAuditFindings: vi.fn() };
});

const mockedBuildContext = vi.mocked(mockAudit.buildMockAuditContext);
const mockedPropose = vi.mocked(mockAudit.proposeMockAuditFindings);

const initialStoreState = useProjectStore.getState();

function seedProject(aiOverrides: Partial<AiMeta> = {}): ProjectModel {
  const { project } = createNewProject({ title: "T", language: "en", appVersion: "0.1.0" });
  const withAi: ProjectModel = {
    ...project,
    meta: {
      ...project.meta,
      owner: { name: "Ada" },
      ai: { enabled: true, providerId: "vorion", modelId: "vorion/gpt-4o", redaction: {}, ...aiOverrides },
    },
  };
  useProjectStore.setState({ ...initialStoreState, project: withAi });
  return withAi;
}

function renderPanel() {
  return render(
    <MemoryRouter>
      <MockAuditPanel />
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.clearAllMocks();
  useProjectStore.setState(initialStoreState, true);
});

describe("MockAuditPanel", () => {
  it("shows a message and a Settings link when no model is configured for this project", () => {
    seedProject({ modelId: undefined });

    renderPanel();

    expect(screen.getByText("No model is chosen for this project yet.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Go to Settings" })).toBeTruthy();
  });

  it("calls buildMockAuditContext and proposeMockAuditFindings on Run audit, and shows the empty state when there are no findings", async () => {
    const user = userEvent.setup();
    seedProject();
    mockedBuildContext.mockReturnValueOnce({ contextText: "the context", droppedNotes: [] });
    mockedPropose.mockResolvedValueOnce({ outcome: "success", findings: [] });

    renderPanel();
    await user.click(screen.getByRole("button", { name: "Run audit" }));

    expect(mockedBuildContext).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/no narrative breaks/i)).toBeTruthy();
    expect(mockedPropose).toHaveBeenCalledWith(
      expect.objectContaining({ contextText: "the context", modelId: "vorion/gpt-4o" }),
    );
  });

  it("shows a dropped-context notice when buildMockAuditContext reports one", async () => {
    const user = userEvent.setup();
    seedProject();
    mockedBuildContext.mockReturnValueOnce({ contextText: "ctx", droppedNotes: ["context note"] });
    mockedPropose.mockResolvedValueOnce({ outcome: "success", findings: [] });

    renderPanel();
    await user.click(screen.getByRole("button", { name: "Run audit" }));

    expect(await screen.findByText("context note")).toBeTruthy();
  });

  it("shows the raw response when the proposal fails — nothing is written, there is nothing to write", async () => {
    const user = userEvent.setup();
    seedProject();
    mockedBuildContext.mockReturnValueOnce({ contextText: "ctx", droppedNotes: [] });
    mockedPropose.mockResolvedValueOnce({ outcome: "failed", rawText: "not valid json at all" });

    renderPanel();
    await user.click(screen.getByRole("button", { name: "Run audit" }));

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByText("not valid json at all")).toBeTruthy();
  });

  it("renders each finding read-only (no checkbox, no Apply) and clicking one jumps to its step", async () => {
    const user = userEvent.setup();
    seedProject();
    mockedBuildContext.mockReturnValueOnce({ contextText: "ctx", droppedNotes: [] });
    mockedPropose.mockResolvedValueOnce({
      outcome: "success",
      findings: [
        {
          stepId: 4,
          severity: "major",
          category: "person-blamed-root-cause",
          message: "The why-why chain for cavity wear ends on 'operator forgot to check', not a systemic factor.",
        },
      ],
    });

    renderPanel();
    await user.click(screen.getByRole("button", { name: "Run audit" }));

    const findingButton = await screen.findByRole("button", { name: /operator forgot to check/ });
    expect(findingButton.textContent).toMatch(/Step 4/);
    expect(findingButton.textContent).toMatch(/Major/);
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.queryByRole("button", { name: /apply/i })).toBeNull();

    await user.click(findingButton);
    expect(useProjectStore.getState().activeStepId).toBe(4);
  });

  it("Run audit again re-runs the analysis", async () => {
    const user = userEvent.setup();
    seedProject();
    mockedBuildContext.mockReturnValue({ contextText: "ctx", droppedNotes: [] });
    mockedPropose.mockResolvedValue({ outcome: "success", findings: [] });

    renderPanel();
    await user.click(screen.getByRole("button", { name: "Run audit" }));
    await screen.findByText(/no narrative breaks/i);
    await user.click(screen.getByRole("button", { name: "Run audit again" }));

    expect(mockedPropose).toHaveBeenCalledTimes(2);
  });
});
