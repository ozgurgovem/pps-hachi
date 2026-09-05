import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import "../../../i18n";
import type { A3LayoutDescriptor } from "../../../a3/descriptor";
import { createNewProject } from "../../../domain/model";
import type { AiMeta, Entry, ProjectModel } from "../../../domain/model";
import { useProjectStore } from "../../../state";
import { LayoutReviewPanel } from "./LayoutReviewPanel";
import * as layoutReview from "./layoutReview";
import type { LayoutReviewDiff } from "./layoutReview";

vi.mock("./layoutReview", async () => {
  const actual = await vi.importActual<typeof import("./layoutReview")>("./layoutReview");
  return { ...actual, buildLayoutReviewContext: vi.fn(), proposeLayoutReviewDiff: vi.fn() };
});

const mockedBuildContext = vi.mocked(layoutReview.buildLayoutReviewContext);
const mockedPropose = vi.mocked(layoutReview.proposeLayoutReviewDiff);

const initialStoreState = useProjectStore.getState();

const FAKE_DESCRIPTOR = {} as A3LayoutDescriptor;

function makeEntry(overrides: Partial<Entry> = {}): Entry {
  const now = new Date().toISOString();
  return {
    id: overrides.id ?? crypto.randomUUID(),
    methodId: "generic-text",
    title: "A test entry",
    order: 0,
    a3Visibility: "primary",
    payload: { text: "hello" },
    images: [],
    createdAt: now,
    updatedAt: now,
    provenance: { origin: "human" },
    ...overrides,
  };
}

function seedProject(aiOverrides: Partial<AiMeta> = {}, entries: Record<number, Entry[]> = {}): ProjectModel {
  const { project } = createNewProject({ title: "T", language: "en", appVersion: "0.1.0" });
  const steps = { ...project.steps };
  for (const [stepId, list] of Object.entries(entries)) {
    steps[Number(stepId) as keyof typeof steps] = { entries: list };
  }
  const withAi: ProjectModel = {
    ...project,
    steps,
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
      <LayoutReviewPanel descriptor={FAKE_DESCRIPTOR} />
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.clearAllMocks();
  useProjectStore.setState(initialStoreState, true);
});

describe("LayoutReviewPanel", () => {
  it("shows a message and a Settings link when no model is configured for this project", () => {
    seedProject({ modelId: undefined });

    renderPanel();

    expect(screen.getByText("No model is chosen for this project yet.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Go to Settings" })).toBeTruthy();
  });

  it("calls buildLayoutReviewContext and proposeLayoutReviewDiff on Analyze", async () => {
    const user = userEvent.setup();
    seedProject();
    mockedBuildContext.mockReturnValueOnce({ contextText: "the context", droppedNotes: [] });
    mockedPropose.mockResolvedValueOnce({
      outcome: "success",
      diff: { visibilityChanges: [], textCondensations: [] },
      droppedNotes: [],
    });

    renderPanel();
    await user.click(screen.getByRole("button", { name: "Analyze layout" }));

    expect(mockedBuildContext).toHaveBeenCalledTimes(1);
    expect(await screen.findAllByText("Nothing proposed here.")).toHaveLength(2);
    expect(mockedPropose).toHaveBeenCalledWith(
      expect.objectContaining({ contextText: "the context", modelId: "vorion/gpt-4o" }),
    );
  });

  it("shows both notice lists (context truncation and dropped condensations) together", async () => {
    const user = userEvent.setup();
    seedProject();
    mockedBuildContext.mockReturnValueOnce({ contextText: "ctx", droppedNotes: ["context note"] });
    mockedPropose.mockResolvedValueOnce({
      outcome: "success",
      diff: { visibilityChanges: [], textCondensations: [] },
      droppedNotes: ["diff note"],
    });

    renderPanel();
    await user.click(screen.getByRole("button", { name: "Analyze layout" }));

    expect(await screen.findByText("context note")).toBeTruthy();
    expect(screen.getByText("diff note")).toBeTruthy();
  });

  it("shows the raw response and applies nothing when the proposal fails", async () => {
    const user = userEvent.setup();
    seedProject();
    mockedBuildContext.mockReturnValueOnce({ contextText: "ctx", droppedNotes: [] });
    mockedPropose.mockResolvedValueOnce({ outcome: "failed", rawText: "not valid json at all" });

    renderPanel();
    await user.click(screen.getByRole("button", { name: "Analyze layout" }));

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByText("not valid json at all")).toBeTruthy();
  });

  it("renders a checked-by-default visibility change and applies it via a real dispatch on Apply", async () => {
    const user = userEvent.setup();
    const entry = makeEntry({ id: "e1", title: "Move me" });
    seedProject({}, { 2: [entry] });
    mockedBuildContext.mockReturnValueOnce({ contextText: "ctx", droppedNotes: [] });
    mockedPropose.mockResolvedValueOnce({
      outcome: "success",
      diff: {
        visibilityChanges: [{ entryId: "e1", newVisibility: "appendix", reason: "supporting detail" }],
        textCondensations: [],
      },
      droppedNotes: [],
    });

    renderPanel();
    await user.click(screen.getByRole("button", { name: "Analyze layout" }));
    expect(await screen.findByText('Move "Move me" to Appendix')).toBeTruthy();
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveProperty("ariaChecked", "true");

    await user.click(screen.getByRole("button", { name: "Apply selected" }));

    const updated = useProjectStore.getState().project;
    expect(updated?.steps[2]?.entries[0]?.a3Visibility).toBe("appendix");
    expect(await screen.findByText("Applied 1 placement change(s) and 0 text condensation(s).")).toBeTruthy();
  });

  it("does not apply a visibility change whose checkbox was unchecked", async () => {
    const user = userEvent.setup();
    const entry = makeEntry({ id: "e1" });
    seedProject({}, { 2: [entry] });
    mockedBuildContext.mockReturnValueOnce({ contextText: "ctx", droppedNotes: [] });
    mockedPropose.mockResolvedValueOnce({
      outcome: "success",
      diff: {
        visibilityChanges: [{ entryId: "e1", newVisibility: "hidden", reason: "duplicate" }],
        textCondensations: [],
      },
      droppedNotes: [],
    });

    renderPanel();
    await user.click(screen.getByRole("button", { name: "Analyze layout" }));
    await screen.findByRole("checkbox");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Apply selected" }));

    const updated = useProjectStore.getState().project;
    expect(updated?.steps[2]?.entries[0]?.a3Visibility).toBe("primary");
  });

  it("applies an accepted text condensation with ai-accepted Provenance", async () => {
    const user = userEvent.setup();
    const entry = makeEntry({ id: "e1", payload: { text: "a very long original sentence" } });
    seedProject({}, { 1: [entry] });
    mockedBuildContext.mockReturnValueOnce({ contextText: "ctx", droppedNotes: [] });
    const diff: LayoutReviewDiff = {
      visibilityChanges: [],
      textCondensations: [{ entryId: "e1", field: "text", condensedText: "shorter sentence", reason: "shorter" }],
    };
    mockedPropose.mockResolvedValueOnce({ outcome: "success", diff, droppedNotes: [] });

    renderPanel();
    await user.click(screen.getByRole("button", { name: "Analyze layout" }));
    await screen.findByRole("checkbox");
    await user.click(screen.getByRole("button", { name: "Apply selected" }));

    const updated = useProjectStore.getState().project;
    const updatedEntry = updated?.steps[1]?.entries[0];
    expect((updatedEntry?.payload as { text: string }).text).toBe("shorter sentence");
    expect(updatedEntry?.provenance.origin).toBe("ai-accepted");
    expect(updatedEntry?.provenance.model?.providerId).toBe("vorion");
    expect(updatedEntry?.provenance.acceptedBy).toBe("Ada");
  });

  it("rejecting the whole diff returns to idle, applying nothing", async () => {
    const user = userEvent.setup();
    const entry = makeEntry({ id: "e1" });
    seedProject({}, { 2: [entry] });
    mockedBuildContext.mockReturnValueOnce({ contextText: "ctx", droppedNotes: [] });
    mockedPropose.mockResolvedValueOnce({
      outcome: "success",
      diff: {
        visibilityChanges: [{ entryId: "e1", newVisibility: "hidden", reason: "duplicate" }],
        textCondensations: [],
      },
      droppedNotes: [],
    });

    renderPanel();
    await user.click(screen.getByRole("button", { name: "Analyze layout" }));
    await user.click(await screen.findByRole("button", { name: "Reject all" }));

    expect(screen.getByRole("button", { name: "Analyze layout" })).toBeTruthy();
    const updated = useProjectStore.getState().project;
    expect(updated?.steps[2]?.entries[0]?.a3Visibility).toBe("primary");
  });
});
